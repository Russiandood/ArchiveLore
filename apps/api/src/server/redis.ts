import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
