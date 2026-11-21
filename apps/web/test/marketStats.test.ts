import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeActivityStats } from "../src/lib/marketStats";

describe("@kradl/web multi-timeframe market activity stats", () => {
  it("slices 5m, 1h, 6h, and 24h windows accurately with buys/sells ratio and price change %", () => {
    const now = 1_800_000_000_000;
    const trades = [
      // 20h ago (only in 24h)
      {
        isBuy: true,
        ethAmount: "100000000000000000", // 0.1 ETH
        priceEth: 0.0001,
        timestamp: new Date(now - 20 * 60 * 60 * 1000),
      },
      // 3h ago (in 6h and 24h)
      {
        isBuy: false,
        ethAmount: "50000000000000000", // 0.05 ETH
        priceEth: 0.00012,
        timestamp: new Date(now - 3 * 60 * 60 * 1000),
      },
      // 30m ago (in 1h, 6h, 24h)
      {
        isBuy: true,
        ethAmount: "20000000000000000", // 0.02 ETH
        priceEth: 0.00015,
        timestamp: new Date(now - 30 * 60 * 1000),
      },
      // 2m ago (in all windows)
      {
        isBuy: true,
        ethAmount: "30000000000000000", // 0.03 ETH
        priceEth: 0.00018,
        timestamp: new Date(now - 2 * 60 * 1000),
      },
    ];

    const stats = computeActivityStats(trades, 0.0002, now);

    // 5m: 1 buy (0.03 ETH), price 0.00018 -> 0.0002 (+11.11%)
    assert.equal(stats["5m"].buys, 1);
    assert.equal(stats["5m"].sells, 0);
    assert.equal(stats["5m"].buyRatioPct, 100);
    assert.equal(stats["5m"].volumeEth, 0.03);
    assert.equal(stats["5m"].priceChangePct, 11.11);

    // 1h: 2 buys (0.05 ETH), price 0.00015 -> 0.0002 (+33.33%)
    assert.equal(stats["1h"].buys, 2);
    assert.equal(stats["1h"].sells, 0);
    assert.equal(stats["1h"].volumeEth, 0.05);
    assert.equal(stats["1h"].priceChangePct, 33.33);

    // 6h: 2 buys, 1 sell (0.10 ETH), buyRatio = 67%
    assert.equal(stats["6h"].buys, 2);
    assert.equal(stats["6h"].sells, 1);
    assert.equal(stats["6h"].buyRatioPct, 67);
    assert.equal(stats["6h"].volumeEth, 0.1);

    // 24h: 3 buys, 1 sell (0.20 ETH), price 0.0001 -> 0.0002 (+100%)
    assert.equal(stats["24h"].buys, 3);
    assert.equal(stats["24h"].sells, 1);
    assert.equal(stats["24h"].buyRatioPct, 75);
    assert.equal(stats["24h"].volumeEth, 0.2);
    assert.equal(stats["24h"].priceChangePct, 100);
  });

  it("handles empty trades and malformed wei safely without NaN", () => {
    const stats = computeActivityStats(
      [{ isBuy: true, ethAmount: "not-a-number", priceEth: 0, timestamp: new Date() }],
      0
    );
    assert.equal(stats["24h"].volumeEth, 0);
    assert.equal(stats["24h"].priceChangePct, 0);
    assert.equal(stats["24h"].buys, 1);

    const empty = computeActivityStats([], 0.0001);
    assert.equal(empty["5m"].buyRatioPct, 50);
    assert.equal(empty["24h"].volumeEth, 0);
  });
});
