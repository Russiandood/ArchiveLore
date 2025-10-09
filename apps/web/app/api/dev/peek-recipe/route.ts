import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { RedisKeys } from "@/lib/redisKeys";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "basic-upgrade";
  const redis = Redis.fromEnv();
  const data = await redis.hgetall(RedisKeys.craft.recipe(id));
  return NextResponse.json({ id, data });
}