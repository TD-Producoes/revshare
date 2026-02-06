/**
 * RevClaw In-Memory Sliding Window Rate Limiter
 *
 * Simple per-key rate limiter for protecting RevClaw endpoints from abuse.
 * Uses a sliding window approach with automatic cleanup of expired entries.
 *
 * For v0, this is in-memory (resets on deploy). For multi-instance deployments,
 * replace with a Redis-backed implementation.
 */

import { NextResponse } from "next/server";

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
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
  retryAfterSeconds: number | null;
}

/**
 * Check if a request is within the rate limit for the given key.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanupStaleEntries(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    // Find when the earliest timestamp in the window will expire
    const oldestInWindow = entry.timestamps[0]!;
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    retryAfterSeconds: null,
  };
}

/**
 * Extract client IP from request headers (works behind proxies).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Return a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

// =============================================================================
// Pre-configured rate limit configs for RevClaw endpoints
// =============================================================================

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/** POST /api/revclaw/agents/register — 10 req / 15 min per IP */
export const REGISTER_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** POST /api/revclaw/tokens — 20 req / 15 min per IP */
export const TOKEN_EXCHANGE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** POST /api/revclaw/tokens/refresh — 30 req / 15 min per IP */
export const TOKEN_REFRESH_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** POST /api/revclaw/intents — 30 req / 15 min per installation */
export const INTENT_CREATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** POST /api/revclaw/plans — 20 req / 15 min per installation */
export const PLAN_CREATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** POST /api/revclaw/plans/:id/execute — 10 req / 15 min per installation */
export const PLAN_EXECUTE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: FIFTEEN_MINUTES_MS,
};
