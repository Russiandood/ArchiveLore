// lib/cost-metrics.ts
// Lightweight command budget + cost projection for Upstash Redis.
// Works with Next.js route handlers – call .add() wherever you perform a block of Redis ops.

import { Redis } from "@upstash/redis";
import { RedisKeys, TTL, EventLabel, yyyymmdd } from "./redisKeys";

// Pricing defaults – adjust if Upstash updates pricing.
const FREE_COMMANDS_PER_DAY = 10_000; // free daily headroom
const COST_PER_100K = 0.20; // $ per 100k commands (PAYG)

export function estimateCost(commandsToday: number) {
  const chargeable = Math.max(0, commandsToday - FREE_COMMANDS_PER_DAY);
  const cost = (chargeable / 100_000) * COST_PER_100K;
  return { chargeable, cost };
}

export class CommandBudget {
  private redis: Redis;
  private localCount = 0;
  private dateKey = yyyymmdd();

  constructor(redis?: Redis) {
    this.redis = redis ?? Redis.fromEnv();
  }

  /** Add an expected number of commands to the in‑request counter. */
  add(label: EventLabel, n: number) {
    if (!Number.isFinite(n) || n <= 0) return;
    this.localCount += n;
    // Fire‑and‑forget increments; latency not critical.
    // 1) Total commands today
    this.redis.incrby(RedisKeys.ops.cmdCountToday, n).then(() =>
      this.redis.expire(RedisKeys.ops.cmdCountToday, TTL.OPS_CMDCOUNT_SECONDS)
    ).catch(() => {});

    // 2) Event breakdown for today
    const eventKey = RedisKeys.ops.eventCountFor(this.dateKey);
    this.redis.hincrby(eventKey, label, 1).then(() =>
      this.redis.expire(eventKey, TTL.OPS_EVENTCOUNT_SECONDS)
    ).catch(() => {});
  }

  /** Read today’s totals and return a cost projection. */
  async snapshot() {
    const total = (await this.redis.get<number>(RedisKeys.ops.cmdCountToday)) ?? 0;
    const { chargeable, cost } = estimateCost(total);
    return { total, chargeable, cost };
  }
}

// Convenience wrapper for API routes –
// use inside each handler after you finish your Redis work to record the budgeted commands.
export async function trackCommands(label: EventLabel, n: number) {
  const meter = new CommandBudget();
  meter.add(label, n);
}

// Optional: an API helper that returns current ops totals for dashboards.
export async function getOpsCostSnapshot() {
  const redis = Redis.fromEnv();
  const total = (await redis.get<number>(RedisKeys.ops.cmdCountToday)) ?? 0;
  const { chargeable, cost } = estimateCost(total);

  // Derive a 30‑day projection by assuming today’s rate repeats.
  const monthlyEst = cost * 30;
  return {
    today_commands: total,
    today_cost_usd: Number(cost.toFixed(4)),
    month_est_usd: Number(monthlyEst.toFixed(2)),
    free_headroom_remaining: Math.max(0, FREE_COMMANDS_PER_DAY - total),
  };
}