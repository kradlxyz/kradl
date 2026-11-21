import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RateLimiter, TtlCache } from "../src/lib/rateLimit";

describe("@kradl/web rate limiter & TTL cache", () => {
  it("allows up to limit requests and blocks subsequent requests until window resets", () => {
    const limiter = new RateLimiter();
    const t0 = 1_000_000;

    assert.equal(limiter.check("ip:1.2.3.4", 2, 60_000, t0).allowed, true);
    assert.equal(limiter.check("ip:1.2.3.4", 2, 60_000, t0 + 1000).allowed, true);

    const blocked = limiter.check("ip:1.2.3.4", 2, 60_000, t0 + 2000);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.retryAfterSec, 58);

    // Different IP is isolated
    assert.equal(limiter.check("ip:5.6.7.8", 2, 60_000, t0 + 2000).allowed, true);

    // After window expires, original IP is allowed again
    assert.equal(limiter.check("ip:1.2.3.4", 2, 60_000, t0 + 60_001).allowed, true);
  });

  it("caches values within TTL and expires cleanly afterward", () => {
    const cache = new TtlCache<{ count: number }>(15_000);
    const t0 = 2_000_000;

    assert.equal(cache.get(t0), null);
    cache.set({ count: 42 }, t0);
    assert.deepEqual(cache.get(t0 + 14_999), { count: 42 });
    assert.equal(cache.get(t0 + 15_000), null);

    cache.set({ count: 99 }, t0 + 20_000);
    cache.invalidate();
    assert.equal(cache.get(t0 + 20_001), null);
  });
});
