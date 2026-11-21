import type { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;

/**
 * Lightweight, memory-bounded per-key rate limiter for Next.js Route Handlers.
 * Safe behind Cloudflare (reads cf-connecting-ip first).
 */
export class RateLimiter {
  private buckets = new Map<string, Bucket>();

  check(
    key: string,
    limit: number,
    windowMs: number,
    now: number = Date.now()
  ): { allowed: boolean; remaining: number; retryAfterSec: number } {
    // Periodic eviction to guarantee bounded memory under heavy bot traffic
    if (this.buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of this.buckets.entries()) {
        if (b.resetAt <= now) this.buckets.delete(k);
      }
      if (this.buckets.size >= MAX_BUCKETS) {
        this.buckets.clear();
      }
    }

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSec: 0 };
    }

    if (existing.count >= limit) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    existing.count += 1;
    return { allowed: true, remaining: Math.max(0, limit - existing.count), retryAfterSec: 0 };
  }
}

export const globalRateLimiter = new RateLimiter();

export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Simple in-memory TTL cache to protect expensive aggregation endpoints
 * (/api/rewards, /api/revenue) from traffic spikes.
 */
export class TtlCache<T> {
  private value: T | null = null;
  private expiresAt = 0;

  constructor(private readonly ttlMs: number) {}

  get(now: number = Date.now()): T | null {
    if (this.value !== null && now < this.expiresAt) {
      return this.value;
    }
    return null;
  }

  set(value: T, now: number = Date.now()): void {
    this.value = value;
    this.expiresAt = now + this.ttlMs;
  }

  invalidate(): void {
    this.value = null;
    this.expiresAt = 0;
  }
}
