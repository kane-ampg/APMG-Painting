import 'server-only';

/**
 * In-memory rate limiter.
 *
 * Deliberately simple and deliberately documented as insufficient for
 * production: serverless instances do not share memory, so a determined
 * submitter routed across instances gets more than the stated allowance.
 *
 * It stops casual form hammering, which is what it is for. Before go-live this
 * should move to a shared store (Upstash Redis or Vercel KV) — noted in the
 * README rather than silently left as-is.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_PER_WINDOW - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Test seam. */
export function resetRateLimits(): void {
  buckets.clear();
}
