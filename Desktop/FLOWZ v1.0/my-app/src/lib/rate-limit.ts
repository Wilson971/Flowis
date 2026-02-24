/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per user per endpoint.
 *
 * For production at scale, replace with Redis or Supabase-based storage.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp ms
}

/**
 * Check and consume a rate limit token for a given user + endpoint.
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + config.windowMs,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

// ============================================================================
// PRESET CONFIGS for FLOWZ endpoints
// ============================================================================

/** FloWriter: 5 requests per minute per user */
export const RATE_LIMIT_FLOWRITER: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60_000,
};

/** Batch generation: 2 requests per minute per user */
export const RATE_LIMIT_BATCH_GENERATION: RateLimitConfig = {
  maxRequests: 2,
  windowMs: 60_000,
};

/** Photo Studio generate: 10 requests per minute per user */
export const RATE_LIMIT_PHOTO_STUDIO: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

/** SEO suggest: 20 requests per minute per user */
export const RATE_LIMIT_SEO_SUGGEST: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};
