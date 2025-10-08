import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys } from "@/lib/redisKeys";


export const runtime = "edge";


/**
* Dev grant endpoint – give a user test inventory so /api/craft succeeds.
* Body (any field optional):
* {
* userId: string,
* materials?: { [k: string]: number },
* essence?: { [tier: string]: number },
* sparks?: { [tier: string]: number }
* }
*/
export async function POST(req: Request) {
const redis = Redis.fromEnv();
const body = await req.json().catch(() => ({}));
const { userId, materials = {}, essence = {}, sparks = {} } = body || {};
if (!userId) return NextResponse.json({ ok: false, error: "missing userId" }, { status: 400 });


const inv = RedisKeys.inv(userId);


for (const [k, v] of Object.entries(materials)) {
await redis.hincrby(inv.materials, k, Number(v));
}
for (const [k, v] of Object.entries(essence)) {
await redis.hincrby(inv.essence, k, Number(v));
}
for (const [k, v] of Object.entries(sparks)) {
await redis.hincrby(inv.sparks, k, Number(v));
}


return NextResponse.json({ ok: true, granted: { materials, essence, sparks } });
}