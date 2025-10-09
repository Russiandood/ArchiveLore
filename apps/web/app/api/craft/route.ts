import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys, TTL } from "@/lib/redisKeys";
import { trackCommands } from "@/lib/cost-metrics";


export const runtime = "edge";


/**
* Body: { userId: string, recipeId: string, amount?: number }
* Assumes a cached recipe at RedisKeys.craft.recipe(recipeId) with fields like:
* input_materials.mundane_dust = 10 (JSON string in a single hash field `input_materials`)
* input_essence.mundane = 5
* output_material = "curious_ore"
* output_amount = 1
* spark_tier = "mundane" (optional)
*/
export async function POST(req: Request) {
    const redis = Redis.fromEnv();
    const { userId, recipeId, amount = 1 } = await req.json();
    if (!userId || !recipeId || amount <= 0) {
        return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
    }


    const lockKey = RedisKeys.craft.lock(userId);
    const lockToken = crypto.randomUUID();


    // Acquire short mutex to prevent double spend
    const gotLock = await redis.set(lockKey, lockToken, { nx: true, ex: 5 });
    if (!gotLock) return NextResponse.json({ ok: false, error: "busy" }, { status: 409 });


    try {
        const recipeKey = RedisKeys.craft.recipe(recipeId);
        const recipe = await redis.hgetall<Record<string, string>>(recipeKey);
        if (!recipe) return NextResponse.json({ ok: false, error: "unknown recipe" }, { status: 404 });


        const inputsMat = JSON.parse(recipe.input_materials || "{}") as Record<string, number>;
        const inputsEss = JSON.parse(recipe.input_essence || "{}") as Record<string, number>;
        const outputMaterial = recipe.output_material as string | undefined;
        const outputEssence = recipe.output_essence as string | undefined; // if crafting essence upgrades
        const outputAmount = Number(recipe.output_amount ?? 1) * amount;
        const sparkTier = recipe.spark_tier as string | undefined;


        const inv = RedisKeys.inv(userId);


        // 1) Validate balances
        if (Object.keys(inputsMat).length) {
            const matFields = Object.keys(inputsMat);
            const matAll = (await redis.hgetall<Record<string, string>>(inv.materials)) ?? {};
            for (let i = 0; i < matFields.length; i++) {
                const field = matFields[i];
                const need = inputsMat[field] * amount;
                const have = Number(matAll[field] ?? 0);
                if (have < need) {
                    return NextResponse.json({ ok: false, error: `need ${need} of ${field}` }, { status: 400 });
                }
            }
        }
        if (Object.keys(inputsEss).length) {
            const essFields = Object.keys(inputsEss);
            const essAll = (await redis.hgetall<Record<string, string>>(inv.essence)) ?? {};
            for (let i = 0; i < essFields.length; i++) {
                const field = essFields[i];
                const need = inputsEss[field] * amount;
                const have = Number(essAll[field] ?? 0);
                if (have < need) {
                    return NextResponse.json({ ok: false, error: `need ${need} essence of ${field}` }, { status: 400 });
                }
            }
        }
        if (sparkTier) {
            const sparkHave = Number((await redis.hget(inv.sparks, sparkTier)) ?? 0);
            if (sparkHave < amount) return NextResponse.json({ ok: false, error: `need ${amount} ${sparkTier} spark` }, { status: 400 });
        }


    // 2) Consume inputs (materials, essence, sparks)
    for (const [k, v] of Object.entries(inputsMat)) {
        await redis.hincrby(inv.materials, k, -v * amount);
    }
    for (const [k, v] of Object.entries(inputsEss)) {
        await redis.hincrby(inv.essence, k, -v * amount);
    }
    if (sparkTier) {
        await redis.hincrby(inv.sparks, sparkTier, -amount);
    }


    // 3) Produce outputs (either a material or an essence upgrade)
    if (outputMaterial) {
        await redis.hincrby(inv.materials, outputMaterial, outputAmount);
    }
    if (outputEssence) {
        await redis.hincrby(inv.essence, outputEssence, outputAmount);
    }


    // 4) Display cache bump
    await redis.setex(
        RedisKeys.display.user(userId),
        TTL.DISPLAY_USER_SECONDS,
        JSON.stringify({ lastCraft: { recipeId, amount } })
    );


    await trackCommands("craft", 11);
    return NextResponse.json({ ok: true, crafted: { recipeId, outputMaterial, outputEssence, amount } });
    } finally {
    // Release lock if we still own it
    const token = await redis.get<string>(lockKey);
    if (token === lockToken) await redis.del(lockKey);
    }
}