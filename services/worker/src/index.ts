// Minimal, polite Fly worker — ≤1 Redis op per minute, no BullMQ.
// Requires REDIS_URL (Upstash) in Fly secrets. TLS enabled.

import Redis from "ioredis";

const url = process.env.REDIS_URL;

// ----- config knobs -----
const MIN_MS = 300_000;           // base cadence: 60s
const JITTER_MS = 10_000;        // ±10s jitter so instances don't sync
const TEST_READ_KEY = "display:page:active"; // harmless read target
// ------------------------

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function idle(msg: string) {
  console.error(msg);
  // keep process alive but do nothing (uses 0 Redis ops)
  setInterval(() => {}, 1 << 30);
}

function createRedis(url: string) {
  // Upstash needs TLS; retry conservatively on network hiccups
  const client = new Redis(url, {
    tls: {},
    maxRetriesPerRequest: null,   // don't explode on blocking commands
    enableReadyCheck: false,      // faster boot in serverless
    retryStrategy: (attempt) => Math.min(1000 * attempt, 10_000),
  });

  client.on("error", (e) => console.error("[redis] error", e?.message || e));
  client.on("end", () => console.warn("[redis] connection ended"));
  client.on("connect", () => console.log("[redis] connected"));

  return client;
}

async function tick(redis: Redis) {
  // ✅ ONE READ ONLY. Do nothing else unless you *really* need to.
  // If you need to react to changes, cache the last seen value in memory.
  const val = await redis.get(TEST_READ_KEY); // 1 Redis op
  // Optional: only log when data changes
  if (val !== lastSeen) {
    lastSeen = val;
    console.log("[tick] display changed at", new Date().toISOString());
  }

  // Schedule next run with jitter to avoid herding if you scale >1
  const jitter = Math.floor((Math.random() * 2 - 1) * JITTER_MS);
  await sleep(MIN_MS + jitter);
}

let running = true;
let lastSeen: string | null = null;

async function main() {
  if (!url) {
    return idle(
      'REDIS_URL missing. Set with: flyctl secrets set REDIS_URL="rediss://default:...@host:6379" -a osg-worker'
    );
  }

  const redis = createRedis(url);
  console.log("[worker] started. Tick cadence ~60s ± 10s, 1 GET per tick.");

  // Clean shutdown
  const shutdown = async (sig: string) => {
    try {
      running = false;
      console.log(`[worker] ${sig} received, closing Redis...`);
      await redis.quit().catch(() => redis.disconnect());
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Gentle loop: await each tick; no tight setInterval that can drift/overlap
  while (running) {
    try {
      await tick(redis);
    } catch (err: any) {
      console.error("[tick] error:", err?.message || err);
      // small backoff before next attempt
      await sleep(5_000);
    }
  }
}

main().catch((e) => {
  console.error("[worker] fatal:", e?.message || e);
  process.exit(1);
});
