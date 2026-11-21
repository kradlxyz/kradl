"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, ColorType, UTCTimestamp } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { CandleInterval } from "@kradl/shared";

interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const INTERVALS: CandleInterval[] = ["1m", "5m", "15m", "1h", "1d"];

export function PriceChart({
  chainId,
  tokenAddress,
  symbol,
}: {
  chainId: number;
  tokenAddress: string;
  symbol: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<CandleInterval>("5m");

  const { data, isLoading } = useQuery<{ candles: CandlePoint[] }>({
    queryKey: ["candles", chainId, tokenAddress, interval],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${chainId}/${tokenAddress}/candles?interval=${interval}`
      );
      if (!res.ok) return { candles: [] };
      return res.json();
    },
    refetchInterval: 5_000,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#111114" },
        textColor: "#A1A1AA",
        fontFamily: '"JetBrains Mono", monospace',
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      width: el.clientWidth,
      height: 380,
      timeScale: {
        borderColor: "#232329",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#232329",
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
      priceFormat: {
        type: "price",
        precision: 9,
        minMove: 0.000000001,
      },
    });

    const candles = data?.candles ?? [];
    if (candles.length > 0) {
      series.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="font-semibold text-white">${symbol} / ETH</span>
          <span className="text-[var(--text-muted)]">Bonding Curve Spot</span>
        </div>
        <div className="flex items-center gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                interval === iv
                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="w-full h-[380px]" />
        {!isLoading && (!data?.candles || data.candles.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1119]/80 text-center px-4">
            <p className="font-display font-medium text-sm text-[var(--text-secondary)]">
              No trades indexed yet for ${symbol}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Be the first to buy on the bonding curve to initialize the live chart.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
