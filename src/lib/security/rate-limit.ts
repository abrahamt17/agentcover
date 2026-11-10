/**
 * Fixed-window in-memory rate limiter for authentication-sensitive server actions.
 *
 * Scope and limits:
 *  - State is per server instance. On serverless platforms each instance keeps
 *    its own counters, so this is a first line of defence, not a guarantee.
 *  - Supabase Auth enforces its own rate limits on sign-in, sign-up and
 *    password-reset emails; those remain the authoritative backstop.
 *  - For production scale, swap the Map for a shared store (e.g. Redis) behind
 *    this same function signature.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}
