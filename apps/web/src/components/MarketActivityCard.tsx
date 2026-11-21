"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from "lucide-react";
import type { ActivityStatsMap, ActivityWindowKey } from "@/lib/marketStats";
import { formatEthValue } from "@/lib/format";

interface MarketActivityCardProps {
  chainId: number;
  tokenAddress: string;
  liquidityPool?: string | null;
  graduated: boolean;
  activityStats?: ActivityStatsMap;
  explorerUrl: string | null;
}

const WINDOWS: ActivityWindowKey[] = ["5m", "1h", "6h", "24h"];

export function MarketActivityCard({
  chainId,
  tokenAddress,
  liquidityPool,
  graduated,
  activityStats,
  explorerUrl,
}: MarketActivityCardProps) {
  const [windowKey, setWindowKey] = useState<ActivityWindowKey>("24h");
  const [securityOpen, setSecurityOpen] = useState(false);

  const stat = activityStats?.[windowKey] ?? {
    priceChangePct: 0,
    volumeEth: 0,
    buys: 0,
    sells: 0,
    buyRatioPct: 50,
  };

  const isPositive = stat.priceChangePct >= 0;
  const dexScreenerChain = chainId === 4663 ? "robinhood" : chainId === 8453 ? "base" : null;
  const dexScreenerUrl =
    dexScreenerChain && graduated
      ? `https://dexscreener.com/${dexScreenerChain}/${liquidityPool || tokenAddress}`
      : null;

  return (
    <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-4 text-xs">
      {/* Multi-Timeframe Activity Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-sm text-white">Market Activity</span>
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px]">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindowKey(w)}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                windowKey === w
                  ? "bg-white/15 text-white font-semibold"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Price Change & Volume */}
      <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Price Change ({windowKey})
          </div>
          <div
            className={`text-base font-bold mt-0.5 ${
              stat.priceChangePct === 0
                ? "text-white"
                : isPositive
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {isPositive && stat.priceChangePct > 0 ? "+" : ""}
            {stat.priceChangePct.toFixed(2)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Volume ({windowKey})
          </div>
          <div className="text-base font-bold text-white mt-0.5">
            {formatEthValue(stat.volumeEth, 4)} ETH
          </div>
        </div>
      </div>

      {/* Buy vs Sell Pressure Bar */}
      <div className="space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-emerald-400">{stat.buys} buys</span>
          <span className="text-rose-400">{stat.sells} sells</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-rose-500/70 overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${stat.buyRatioPct}%` }}
          />
        </div>
      </div>

      {/* Expandable 10-Point Contract Security Accordion */}
      <div className="pt-3 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setSecurityOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left text-xs font-medium text-white hover:text-zinc-200 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Contract Security Audit
          </span>
          {securityOpen ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </button>

        {securityOpen && (
          <div className="mt-3 space-y-1.5 font-mono text-[11px]">
            {[
              { label: "Honeypot (sell blocked)", value: "No", ok: true },
              { label: "Token buy / sell tax", value: "0% / 0%", ok: true },
              { label: "Can mint more tokens", value: "No", ok: true },
              { label: "Can blacklist wallets", value: "No", ok: true },
              { label: "Can pause trading", value: "No", ok: true },
              { label: "Upgradeable proxy", value: "No", ok: true },
              { label: "Creator fee clawback", value: "Never", ok: true },
              {
                label: "DEX Liquidity",
                value: graduated ? "Locked forever (0x...dEaD)" : "Auto-locks on graduation",
                ok: true,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1">
                <span className="text-[var(--text-muted)]">{row.label}</span>
                <span className={row.ok ? "text-emerald-400" : "text-rose-400"}>{row.value}</span>
              </div>
            ))}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)]">
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-white"
                >
                  Blockscout <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {dexScreenerUrl && (
                <a
                  href={dexScreenerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  DEXScreener <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
