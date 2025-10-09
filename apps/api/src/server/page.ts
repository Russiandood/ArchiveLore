import { redis } from "./redis";

export type PageTier = "mundane" | "curious" | "artifact" | "relic" | "sacred" | "divine";

const K = {
  tier: "page:active:tier",
  target: "page:active:target",
  progress: "page:active:progress",
  participants: "page:active:participants",
  lock: "page:active:lock",
  history: "page:history",
  events: "page:events",
} as const;

export async function getActivePage() {
  const [tier, progress, target] = await Promise.all([
    redis.get<string>(K.tier),
    redis.get<number>(K.progress),
    redis.get<number>(K.target),
  ]);
  return {
    tier: (tier as PageTier) ?? "mundane",
    progress: Number(progress ?? 0),
    target: Number(target ?? 0),
  };
}

export async function setActivePage(tier: PageTier, target: number) {
  await redis.multi()
    .set(K.tier, tier)
    .set(K.target, target)
    .set(K.progress, 0)
    .del(K.participants, K.lock)
    .exec();
  await redis.publish(K.events, JSON.stringify({ type: "PAGE_SET", tier, target }));
}

export async function addParticipant(userId: string) {
  await redis.sadd(K.participants, userId);
}

export async function incrProgress(by = 1) {
  return await redis.incrby(K.progress, by);
}

export async function getParticipants(): Promise<string[]> {
  return (await redis.smembers<string>(K.participants)) ?? [];
}

export async function pushPageHistory(tier: PageTier) {
  const snap = await getActivePage();
  await redis.lpush(
    K.history,
    JSON.stringify({ tier, target: snap.target, progress: snap.progress, at: Date.now() })
  );
}
