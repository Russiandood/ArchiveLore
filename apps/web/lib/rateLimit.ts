// apps/web/lib/rateLimit.ts
// Minimal, command-cheap fixed-window rate limiter.
// Usage: await enforceFixedWindow(redis, key, limit, windowSeconds)

import { Redis } from "@upstash/redis";


export async function enforceFixedWindow(
redis: Redis,
key: string,
limit: number,
windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
const count = await redis.incr(key); // +1
if (count === 1) {
// set window on first hit
await redis.expire(key, windowSeconds);
}
return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}