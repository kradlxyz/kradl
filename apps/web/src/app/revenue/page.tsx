"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getChainConfig, getTxExplorerUrl } from "@kradl/shared";
import { formatEthValue, timeAgo } from "@/lib/format";

interface RevenueResponse {
  summary: {
    totalProjects: number;
    verifiedProjects: number;
    totalTrades: number;
    totalVolumeEth: number;
    totalBuilderFeesEth: number;
    totalPlatformFeesEth: number;
  };
  daily: Array<{
    date: string;
    volumeEth: number;
    platformFeeEth: number;
    builderFeeEth: number;
    trades: number;
  }>;
  recentFeeEvents: Array<{
    id: string;
    chainId: number;
    tokenAddress: string;
    projectName: string;
    symbol: string;
    txHash: string;
    isBuy: boolean;
    ethAmount: string;
    platformFee: string;
    creatorFee: string;
    timestamp: string;
  }>;
}

export default function RevenuePage() {
  const { data, isLoading } = useQuery<RevenueResponse>({
    queryKey: ["protocol-revenue"],
    queryFn: async () => {
      const res = await fetch("/api/revenue");
      if (!res.ok) throw new Error("Failed to load revenue");
      return res.json();
    },
    refetchInterval: 15_000,
  });

  const summary = data?.summary;
  const daily = data?.daily ?? [];
  const events = data?.recentFeeEvents ?? [];

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="font-display font-bold text-3xl tracking-tight text-white">
          Protocol Revenue &amp; Transparency
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Every trade on Kradl splits 1% evenly: 0.5% streams directly to the app builder and 0.5%
          accrues to the protocol treasury. All figures below are indexed directly from on-chain
          events.
        </p>
      </div>

      {/* Live Ledger Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-mono text-[var(--text-muted)]">Builder Fees Generated</div>
          <div className="mt-2 text-2xl font-mono tabular-nums font-semibold text-[var(--accent-primary)]">
            {isLoading ? "—" : `${formatEthValue(summary?.totalBuilderFeesEth ?? 0, 4)} ETH`}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">0.5% of every trade</div>
        </div>

        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-mono text-[var(--text-muted)]">Protocol Treasury Fees</div>
          <div className="mt-2 text-2xl font-mono tabular-nums font-semibold text-white">
            {isLoading ? "—" : `${formatEthValue(summary?.totalPlatformFeesEth ?? 0, 4)} ETH`}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">0.5% trade + 2% graduation</div>
        </div>

        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-mono text-[var(--text-muted)]">Cumulative Volume</div>
          <div className="mt-2 text-2xl font-mono tabular-nums font-semibold text-white">
            {isLoading ? "—" : `${formatEthValue(summary?.totalVolumeEth ?? 0, 3)} ETH`}
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--text-muted)]">
            {summary?.totalTrades ?? 0} on-chain trades
          </div>
        </div>

        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-mono text-[var(--text-muted)]">Launched Apps</div>
          <div className="mt-2 text-2xl font-mono tabular-nums font-semibold text-white">
            {isLoading ? "—" : summary?.totalProjects ?? 0}
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--text-muted)]">
            {summary?.verifiedProjects ?? 0} verified builders
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-lg text-white">
          Daily Protocol Volume &amp; Fees (Last 30 Days)
        </h2>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Date (UTC)</th>
                <th className="py-3 px-4 text-right">Trades</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-right">Builder Fees</th>
                <th className="py-3 px-4 text-right">Protocol Fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {daily.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-[var(--text-secondary)] font-sans text-sm">
                    No trades recorded in the last 30 days yet. Once trades execute on-chain, daily
                    protocol revenue appears here automatically.
                  </td>
                </tr>
              ) : (
                daily.map((d) => (
                  <tr key={d.date} className="hover:bg-[var(--bg-elevated)]/60">
                    <td className="py-3 px-4 text-white">{d.date}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">{d.trades}</td>
                    <td className="py-3 px-4 text-right text-white">
                      {formatEthValue(d.volumeEth, 4)} ETH
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--accent-primary)]">
                      {formatEthValue(d.builderFeeEth, 5)} ETH
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                      {formatEthValue(d.platformFeeEth, 5)} ETH
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verifiable On-Chain Fee Events */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-lg text-white">
          Recent On-Chain Fee Events
        </h2>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">App</th>
                <th className="py-3 px-4">Network</th>
                <th className="py-3 px-4 text-right">Trade Size</th>
                <th className="py-3 px-4 text-right">Builder (0.5%)</th>
                <th className="py-3 px-4 text-right">Protocol (0.5%)</th>
                <th className="py-3 px-4 text-right">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-[var(--text-secondary)] font-sans text-sm">
                    No fee transactions indexed yet.
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const txUrl = getTxExplorerUrl(ev.chainId, ev.txHash);
                  return (
                    <tr key={ev.id} className="hover:bg-[var(--bg-elevated)]/60">
                      <td className="py-3 px-4">
                        <Link
                          href={`/project/${ev.chainId}/${ev.tokenAddress}`}
                          className="text-white hover:text-[var(--accent-primary)]"
                        >
                          {ev.projectName} <span className="text-[var(--text-muted)]">${ev.symbol}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {getChainConfig(ev.chainId)?.shortName ?? ev.chainId}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatEthValue(ev.ethAmount, 4)} ETH
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--accent-primary)]">
                        {formatEthValue(ev.creatorFee, 5)} ETH
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                        {formatEthValue(ev.platformFee, 5)} ETH
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)]">
                        {txUrl ? (
                          <a href={txUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">
                            {timeAgo(ev.timestamp)}
                          </a>
                        ) : (
                          timeAgo(ev.timestamp)
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
