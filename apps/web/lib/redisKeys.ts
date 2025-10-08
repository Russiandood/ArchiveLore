// lib/redisKeys.ts
// Centralized Redis key builders + TTLs for the Forge.
// Keep all key patterns and expirations consistent across routes.

export const TTL = {
  // short‑lived UI caches
  DISPLAY_USER_SECONDS: 5,
  DISPLAY_PAGE_SECONDS: 2,

  // rate limit windows – tune per endpoint
  RL_CHECKIN_SECONDS: 10,
  RL_CRAFT_SECONDS: 3,
  RL_STATUS_SECONDS: 2,

  // idempotency + crumbs
  CHECKIN_TODAY_SECONDS: 60 * 60 * 24, // 1 day
  ENTRANTS_AFTER_CLOSE_SECONDS: 60 * 60 * 24 * 7, // 7 days
  ESSENCE_CRUMBS_SECONDS: 60 * 60 * 24 * 14, // 14 days

  // analytics + ops
  OPS_CMDCOUNT_SECONDS: 60 * 60 * 48, // 2 days
  OPS_EVENTCOUNT_SECONDS: 60 * 60 * 24 * 14, // 14 days
  OPS_LAST_ERROR_SECONDS: 60 * 60, // 1 hour

  // rng + audit
  RNG_SEED_SECONDS: 60 * 60 * 24 * 2, // 2 days
  RNG_ROLLS_SECONDS: 60 * 60 * 24 * 2,
} as const;

export function yyyymmdd(d = new Date()): string {
  // Always use UTC to avoid off‑by‑one day around midnight and DST.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export const RedisKeys = {
  // 1) Users
  user: (id: string) => ({
    profile: `user:${id}:profile`,
    seen: `user:${id}:seen`,
    flags: `user:${id}:flags`,
  }),

  // 2) Rate limiting
  ratelimit: {
    checkin: (idOrIp: string) => `ratelimit:checkin:${idOrIp}`,
    craft: (userId: string) => `ratelimit:craft:${userId}`,
    status: (userId: string) => `ratelimit:status:${userId}`,
  },

  // 3) Pity – per user
  pity: (userId: string) => `pity:${userId}`, // Hash with fields: relic_step, sacred_step, divine_step, *_awake, last_roll_ts
  pityStats: (date = yyyymmdd()) => `pity:stats:${date}`, // optional daily aggregate

  // 4) Inventory – materials, essence, sparks
  inv: (userId: string) => ({
    materials: `inv:${userId}:materials`, // Hash fields: mundane_dust, curious_ore, artifact_ingot, relic_core, sacred_lumenite, divine_prismatic_latticite
    essence: `inv:${userId}:essence`, // Hash fields: mundane, curious, artifact, relic, sacred, divine
    sparks: `inv:${userId}:sparks`, // Hash fields per tier
  }),

  // 5) Check‑in – streak and daily sets
  checkin: (userId: string) => ({
    streak: `checkin:${userId}:streak`, // Hash: count, last_checkin_date, misses
    todayGuard: `checkin:${userId}:today`, // String idempotency guard
  }),
  checkinUsersFor: (date = yyyymmdd()) => `checkin:${date}:users`, // Set of user IDs

  // 6) Essence tick – passive grants
  essence: (userId: string) => ({
    tick: `essence:tick:${userId}`, // Hash: last_tick_ts, accrued_in_window
  }),
  essenceGrantLogFor: (date = yyyymmdd()) => `essence:grantlog:${date}`,

  // 7) Crafting
  craft: {
    lock: (userId: string) => `craft:lock:${userId}`, // short mutex
    recipe: (recipeId: string) => `craft:recipe:${recipeId}`,
    statsFor: (date = yyyymmdd()) => `craft:stats:${date}`,
  },

  // 8) Pages – global stream progress
  page: {
    active: `page:active`,
    meta: (pageId: string) => `page:${pageId}:meta`, // Hash
    progress: (pageId: string) => `page:${pageId}:progress`, // Hash: current, target, contributors
    entrants: (pageId: string) => `page:${pageId}:entrants`, // Set
    rewardsPool: (pageId: string) => `page:${pageId}:rewards:pool`, // Hash (post‑completion)
    history: `page:history`, // List of page IDs
  },

  // 9) RNG audit
  rng: {
    seedFor: (date = yyyymmdd()) => `rng:seed:${date}`,
    rollsFor: (date = yyyymmdd()) => `rng:rolls:${date}`,
  },

  // 10) Display caches
  display: {
    user: (userId: string) => `display:user:${userId}`,
    pageActive: `display:page:active`,
  },

  // 11) Analytics / Ops
  ops: {
    cmdCountToday: `ops:cmdcount:today`, // String – total expected commands today
    eventCountFor: (date = yyyymmdd()) => `ops:eventcount:${date}`, // Hash – by event label
    lastError: `ops:last_error`,
  },
};

export type EventLabel =
  | "check-in"
  | "craft"
  | "page:progress"
  | "status"
  | "essence:tick"
  | "ratelimit"
  | "other";