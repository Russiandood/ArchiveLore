import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys, TTL } from "@/lib/redisKeys";
import { trackCommands } from "@/lib/cost-metrics";


export const runtime = "edge";


/** Body: { userId: string, pageId?: string, amount?: number } */
export async function POST(req: Request) {
const redis = Redis.fromEnv();
const { userId, pageId: bodyPageId, amount = 1 } = await req.json();
if (!userId) return NextResponse.json({ ok: false, error: "missing userId" }, { status: 400 });


const pageId = bodyPageId || (await redis.get<string>(RedisKeys.page.active));
if (!pageId) return NextResponse.json({ ok: false, error: "no active page" }, { status: 400 });


const progressKey = RedisKeys.page.progress(pageId);
const entrantsKey = RedisKeys.page.entrants(pageId);


const current = await redis.hincrby(progressKey, "current", amount);
await redis.sadd(entrantsKey, userId);


// Optional: cap at target if defined
const targetStr = await redis.hget<string>(progressKey, "target");
const target = targetStr ? Number(targetStr) : undefined;


if (target && current >= target) {
// mark meta state = done
await redis.hset(RedisKeys.page.meta(pageId), { state: "done", finishedAt: new Date().toISOString() });
}


await redis.setex(
RedisKeys.display.pageActive,
TTL.DISPLAY_PAGE_SECONDS,
JSON.stringify({ pageId, current, target })
);


await trackCommands("page:progress", 7);
return NextResponse.json({ ok: true, pageId, current, target });
}