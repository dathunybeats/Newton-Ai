import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

/**
 * Rate limiters for note creation
 * Uses sliding window algorithm for smooth rate limiting
 *
 * Note: Quiz and flashcard generation are NOT rate limited separately
 * since they are part of the note creation workflow. Users can generate
 * unlimited quizzes/flashcards for notes they've already created.
 */

// Free tier: 3 notes per hour
export const noteRateLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, "1h"),
  analytics: true,
  prefix: "ratelimit:notes:free",
});

// Paid tier: 20 notes per hour
export const noteRateLimiterPaid = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "1h"),
  analytics: true,
  prefix: "ratelimit:notes:paid",
});

// Per-IP rate limit for unauthenticated requests (future use)
export const ipRateLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1h"),
  analytics: true,
  prefix: "ratelimit:ip",
});

/**
 * Check rate limit for note creation
 * @param userId - User ID
 * @param isPaid - Whether user has paid subscription
 */
export async function checkRateLimit(
  userId: string,
  isPaid: boolean,
  operation: "note" = "note"
) {
  const limiter = isPaid ? noteRateLimiterPaid : noteRateLimiter;
  const { success, limit, reset, remaining } = await limiter.limit(userId);

  return {
    success,
    limit,
    reset,
    remaining,
  };
}

/**
 * Check rate limit by IP address (for unauthenticated requests)
 */
export async function checkIpRateLimit(ip: string) {
  const { success, limit, reset, remaining } = await ipRateLimiter.limit(ip);

  return {
    success,
    limit,
    reset,
    remaining,
  };
}
