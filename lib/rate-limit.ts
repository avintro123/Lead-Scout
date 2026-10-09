import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding-window store partitioned by endpoint & client IP
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Keep only timestamps within the last 15 minutes
      const active = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (active.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, { timestamps: active });
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extracts the real client IP address safely from request headers
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // In multi-proxy setups, the client IP is the first entry
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

export interface RateLimitOptions {
  limit: number;          // Max allowed requests
  windowSeconds: number;  // Window duration in seconds
  endpointKey?: string;   // Identifier for the endpoint (e.g. 'scout', 'analyze')
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  response?: NextResponse;
}

/**
 * Checks and records a request against sliding-window rate limit.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(req);
  const endpoint = options.endpointKey || req.nextUrl.pathname;
  const storeKey = `${endpoint}:${ip}`;

  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const cutoff = now - windowMs;

  const record = rateLimitStore.get(storeKey) || { timestamps: [] };

  // Filter timestamps within current sliding window
  const recentTimestamps = record.timestamps.filter((ts) => ts > cutoff);

  const currentCount = recentTimestamps.length;
  const resetSeconds = Math.max(
    1,
    Math.ceil(
      (recentTimestamps.length > 0
        ? recentTimestamps[0] + windowMs - now
        : windowMs) / 1000
    )
  );

  if (currentCount >= options.limit) {
    const errorResponse = NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please wait ${resetSeconds}s before trying again.`,
        retryAfter: resetSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(resetSeconds),
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetSeconds),
        },
      }
    );

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetSeconds,
      response: errorResponse,
    };
  }

  // Record this valid request
  recentTimestamps.push(now);
  rateLimitStore.set(storeKey, { timestamps: recentTimestamps });

  const remaining = Math.max(0, options.limit - recentTimestamps.length);

  return {
    success: true,
    limit: options.limit,
    remaining,
    resetSeconds,
  };
}
