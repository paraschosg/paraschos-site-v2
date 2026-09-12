import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared rate limiter for the contact endpoint.
//
// Serverless functions don't share memory, so an in-process counter only
// limits one instance and resets on every cold start. When Upstash Redis is
// configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) the counter is
// shared across every instance and region. Without it we fall back to memory
// and say so once in the logs, so a missing config is never silent.

const LIMIT = 5;
const WINDOW = "10 m";

let upstash: Ratelimit | null = null;
let warned = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  upstash = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
    prefix: "contact",
  });
}

const memory = new Map<string, number[]>();

export async function checkRateLimit(key: string): Promise<{ ok: boolean; retryAfter?: number }> {
  if (upstash) {
    const r = await upstash.limit(key);
    return { ok: r.success, retryAfter: r.success ? undefined : Math.ceil((r.reset - Date.now()) / 1000) };
  }

  if (!warned) {
    console.warn("[ratelimit] Upstash not configured; using per-instance memory. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
    warned = true;
  }
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  memory.set(key, recent);
  return { ok: recent.length <= LIMIT };
}
