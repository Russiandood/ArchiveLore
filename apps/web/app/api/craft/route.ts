// apps/web/app/api/craft/route.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys, TTL } from "@/lib/redisKeys";
import { trackCommands } from "@/lib/cost-metrics";

export const runtime = "nodejs";            // keep Node while debugging
export const dynamic = "force-dynamic";     // never static

export async function POST(req: Request) {
  try {
    return await realCraftHandler(req);
  } catch (err: any) {
    // Surface the error so we can see what's breaking
    const message = err?.message || String(err);
    console.error("[craft] Uncaught error:", message, err?.stack);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function parseObj(val: unknown): Record<string, number> {
  if (val == null) return {};
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("{") || s.startsWith("[")) return JSON.parse(s);
    if (s === "[object Object]") return {};
    return {};
  }
  if (typeof val === "object") return val as Record<string, number>;
  return {};
}

async function realCraftHandler(req: Request) {
  const redis = Redis.fromEnv();

  const parsed = await req.json().catch(() => null);
  const userId = parsed?.userId as string | undefined;
  const recipeId = parsed?.recipeId as string | undefined;
  const amount = Math.max(1, Number(parsed?.amount ?? 1));
  if (!userId || !recipeId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  // Short mutex to prevent double-spend on rapid clicks
  const lockKey = RedisKeys.craft.lock(userId);
  const lockToken = crypto.randomUUID();
  const gotLock = await redis.set(lockKey, lockToken, { nx: true, ex: 5 });
  if (!gotLock) {
    await trackCommands("craft", 2);
    return NextResponse.json({ ok: false, error: "busy" }, { status: 409 });
  }

  try {
    // Load recipe
    const recipeKey = RedisKeys.craft.recipe(recipeId);
    const recipe = await redis.hgetall<Record<string, string>>(recipeKey);
    if (!recipe) {
      await trackCommands("craft", 3);
      return NextResponse.json({ ok: false, error: "unknown recipe" }, { status: 404 });
    }

    const inputsMat = parseObj(recipe.input_materials);
    const inputsEss = parseObj(recipe.input_essence);
    const outputMaterial = recipe.output_material as string | undefined;
    const outputEssence = recipe.output_essence as string | undefined;
    const outputAmount = Number(recipe.output_amount ?? 1) * amount;
    const sparkTier = recipe.spark_tier as string | undefined;

    const inv = RedisKeys.inv(userId);

    // Validate balances
    if (Object.keys(inputsMat).length) {
      const matAll = (await redis.hgetall<Record<string, string>>(inv.materials)) ?? {};
      for (const field of Object.keys(inputsMat)) {
        const need = inputsMat[field] * amount;
        const have = Number(matAll[field] ?? 0);
        if (have < need) {
          await trackCommands("craft", 5);
          return NextResponse.json({ ok: false, error: `need ${need} of ${field}` }, { status: 400 });
        }
      }
    }

    if (Object.keys(inputsEss).length) {
      const essAll = (await redis.hgetall<Record<string, string>>(inv.essence)) ?? {};
      for (const field of Object.keys(inputsEss)) {
        const need = inputsEss[field] * amount;
        const have = Number(essAll[field] ?? 0);
        if (have < need) {
          await trackCommands("craft", 5);
          return NextResponse.json({ ok: false, error: `need ${need} essence of ${field}` }, { status: 400 });
        }
      }
    }

    if (sparkTier) {
      const sparkHave = Number((await redis.hget(inv.sparks, sparkTier)) ?? 0);
      if (sparkHave < amount) {
        await trackCommands("craft", 4);
        return NextResponse.json({ ok: false, error: `need ${amount} ${sparkTier} spark` }, { status: 400 });
      }
    }

    // Consume inputs
    for (const [k, v] of Object.entries(inputsMat)) await redis.hincrby(inv.materials, k, -v * amount);
    for (const [k, v] of Object.entries(inputsEss)) await redis.hincrby(inv.essence, k, -v * amount);
    if (sparkTier) await redis.hincrby(inv.sparks, sparkTier, -amount);

    // Produce outputs
    if (outputMaterial) await redis.hincrby(inv.materials, outputMaterial, outputAmount);
    if (outputEssence) await redis.hincrby(inv.essence, outputEssence, outputAmount);

    // Short-lived display cache for overlays
    await redis.setex(
      RedisKeys.display.user(userId),
      TTL.DISPLAY_USER_SECONDS,
      JSON.stringify({ lastCraft: { recipeId, amount, outputMaterial, outputEssence, outputAmount } })
    );

    await trackCommands("craft", 11);
    return NextResponse.json({
      ok: true,
      crafted: { recipeId, outputMaterial, outputEssence, amount, outputAmount },
    });
  } finally {
    const current = await redis.get<string>(lockKey);
    if (current === lockToken) await redis.del(lockKey);
  }
}
