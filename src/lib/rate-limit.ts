/**
 * Simple in-memory rate limiter using token bucket algorithm.
 * For production, replace with Redis-backed implementation.
 */
const buckets = new Map<string, { tokens: number; lastRefill: number }>();

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  window: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 10, window: 60_000 }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.lastRefill > options.window) {
    buckets.set(key, { tokens: options.limit - 1, lastRefill: now });
    return { allowed: true, remaining: options.limit - 1 };
  }

  if (bucket.tokens <= 0) {
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}

/**
 * Returns a 429 response if rate limited.
 */
export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }
  );
}
