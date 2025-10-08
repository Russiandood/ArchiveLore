import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys, TTL } from "@/lib/redisKeys";
import { trackCommands } from "@/lib/cost-metrics";
import { enforceFixedWindow } from "@/lib/rateLimit";


export const runtime = "edge"; // fast, low-latency


export async function POST(req: Request) {
const redis = Redis.fromEnv();
const { userId, ip } = await req.json();
if (!userId) return NextResponse.json({ ok: false, error: "missing userId" }, { status: 400 });


// 1) Rate limit (1 check-in per 10s per user/ip)
const rlKey = RedisKeys.ratelimit.checkin(ip ?? userId);
const rl = await enforceFixedWindow(redis, rlKey, 1, TTL.RL_CHECKIN_SECONDS);
if (!rl.allowed) {
await trackCommands("ratelimit", 2);
return NextResponse.json({ ok: false, error: "rate_limited", remaining: rl.remaining }, { status: 429 });
}


// 2) Idempotency for calendar day (UTC)
const todayKey = RedisKeys.checkin(userId).todayGuard;
const already = await redis.get(todayKey);
if (already) {
await trackCommands("check-in", 6); // RL + guard exit
return NextResponse.json({ ok: true, repeated: true });
}
await redis.setex(todayKey, TTL.CHECKIN_TODAY_SECONDS, "1");


// 3) Update streak + pity + grant essence/materials (minimal example)
const streakKey = RedisKeys.checkin(userId).streak;
const pityKey = RedisKeys.pity(userId);
const invEssence = RedisKeys.inv(userId).essence;
const invMaterials = RedisKeys.inv(userId).materials;


const streak = await redis.hincrby(streakKey, "count", 1);
await redis.hset(streakKey, { last_checkin_date: new Date().toISOString() });


// Simple grant: +5 mundane essence, +1 mundane dust
await redis.hincrby(invEssence, "mundane", 5);
await redis.hincrby(invMaterials, "mundane_dust", 1);


// Advance relic pity step by 1 (your curve logic can hook here)
await redis.hincrby(pityKey, "relic_step", 1);


// 4) Short-lived display cache for overlays
const displayKey = RedisKeys.display.user(userId);
await redis.setex(
displayKey,
TTL.DISPLAY_USER_SECONDS,
JSON.stringify({ streak, grants: { essence: 5, mundane_dust: 1 } })
);


// 5) Command budget estimate for this handler
await trackCommands("check-in", 16);


return NextResponse.json({ ok: true, streak, grants: { essence: 5, mundane_dust: 1 } });
}