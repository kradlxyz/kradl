import { formatEther } from "viem";

export type ActivityWindowKey = "5m" | "1h" | "6h" | "24h";

export interface ActivityTradePoint {
  isBuy: boolean;
  ethAmount: string; // wei string
  priceEth: number;
  timestamp: Date | string;
}

export interface WindowActivityStat {
  priceChangePct: number;
  volumeEth: number;
  buys: number;
  sells: number;
  buyRatioPct: number;
}

export type ActivityStatsMap = Record<ActivityWindowKey, WindowActivityStat>;

const WINDOW_MS: Record<ActivityWindowKey, number> = {
  "5m": 5 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

const WINDOW_KEYS: ActivityWindowKey[] = ["5m", "1h", "6h", "24h"];

/**
 * Computes multi-timeframe (5m / 1h / 6h / 24h) trading activity stats from raw trades:
 * - Price change % from the earliest trade in the window to currentPriceEth
 * - Total ETH volume (exact BigInt sum converted to number for display)
 * - Buys vs sells counts and buy pressure ratio %
 */
export function computeActivityStats(
  trades: ActivityTradePoint[],
  currentPriceEth: number,
  nowMs: number = Date.now()
): ActivityStatsMap {
  // Normalize and sort ascending by timestamp
  const sorted = trades
    .map((t) => ({
      isBuy: t.isBuy,
      ethWei: safeBigInt(t.ethAmount),
      priceEth: Number.isFinite(t.priceEth) ? t.priceEth : 0,
      ts: t.timestamp instanceof Date ? t.timestamp.getTime() : new Date(t.timestamp).getTime(),
    }))
    .filter((t) => Number.isFinite(t.ts))
    .sort((a, b) => a.ts - b.ts);

  const result = {} as ActivityStatsMap;

  for (const key of WINDOW_KEYS) {
    const cutoff = nowMs - WINDOW_MS[key];
    let volumeWei = 0n;
    let buys = 0;
    let sells = 0;
    let firstPriceInWindow: number | null = null;

    for (const t of sorted) {
      if (t.ts < cutoff) continue;
      if (firstPriceInWindow === null && t.priceEth > 0) {
        firstPriceInWindow = t.priceEth;
      }
      volumeWei += t.ethWei;
      if (t.isBuy) buys += 1;
      else sells += 1;
    }

    const totalTrades = buys + sells;
    const buyRatioPct = totalTrades === 0 ? 50 : Math.round((buys / totalTrades) * 100);
    const volumeEth = Number(formatEther(volumeWei));

    let priceChangePct = 0;
    if (firstPriceInWindow && firstPriceInWindow > 0 && currentPriceEth > 0) {
      priceChangePct = ((currentPriceEth - firstPriceInWindow) / firstPriceInWindow) * 100;
    }

    result[key] = {
      priceChangePct: Number(priceChangePct.toFixed(2)),
      volumeEth: Number(volumeEth.toFixed(6)),
      buys,
      sells,
      buyRatioPct,
    };
  }

  return result;
}

function safeBigInt(raw: string): bigint {
  try {
    const v = BigInt(raw || "0");
    return v > 0n ? v : 0n;
  } catch {
    return 0n;
  }
}
