import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys } from "@/lib/redisKeys";


export const runtime = "edge";


/**
* Dev seeding endpoint – seeds a basic craft recipe and an active page with a target.
* This is safe to delete later.
*/
export async function POST() {
const redis = Redis.fromEnv();


// 1) Seed a basic recipe for /api/craft tests
const recipeId = "basic-upgrade";
const recipeKey = RedisKeys.craft.recipe(recipeId);
await redis.hset(recipeKey, {
input_materials: JSON.stringify({ mundane_dust: 10 }),
input_essence: JSON.stringify({ mundane: 5 }),
output_material: "curious_ore",
output_amount: 1,
spark_tier: "mundane", // optional in your craft route
});


// 2) Seed an active page with a target
const pageId = "page-1";
await redis.set(RedisKeys.page.active, pageId);
await redis.hset(RedisKeys.page.meta(pageId), { tier: "mundane", state: "active", createdAt: new Date().toISOString() });
await redis.hset(RedisKeys.page.progress(pageId), { current: 0, target: 25, contributors: 0 });


return NextResponse.json({ ok: true, seeded: { recipeId, pageId } });
}