import { NextResponse } from "next/server";
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
const matVals = await redis.hmget<number[]>(inv.materials, ...matFields);
for (let i = 0; i < matFields.length; i++) {
const need = inputsMat[matFields[i]] * amount;
const have = Number(matVals?.[i] ?? 0);
if (have < need) return NextResponse.json({ ok: false, error: `need ${need} of ${matFields[i]}` }, { status: 400 });
}
}
if (Object.keys(inputsEss).length) {
const essFields = Object.keys(inputsEss);
const essVals = await redis.hmget<number[]>(inv.essence, ...essFields);
for (let i = 0; i < essFields.length; i++) {
const need = inputsEss[essFields[i]] * amount;
const have = Number(essVals?.[i] ?? 0);
if (have < need) return NextResponse.json({ ok: false, error: `need ${need} essence of ${essFields[i]}` }, { status: 400 });
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