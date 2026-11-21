"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getChainConfig } from "@kradl/shared";
import { formatCompactNumber, formatEthValue, shortenAddress } from "@/lib/format";
import { ProjectCardData } from "@/components/ProjectCard";

interface BuilderRank {
  walletAddress: string;
  user: { displayName?: string | null } | null;
  projectCount: number;
  totalCreatorFeeEth: number;
  totalVolumeEth: number;
  totalMarketCapEth: number;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"projects" | "builders">("projects");

  const { data, isLoading } = useQuery<{
    topProjects: ProjectCardData[];
    topBuilders: BuilderRank[];
  }>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return { topProjects: [], topBuilders: [] };
      return res.json();
    },
  });

  const topProjects = data?.topProjects ?? [];
  const topBuilders = data?.topBuilders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-white">Leaderboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Apps ranked by market cap and volume; builders ranked by ETH fees earned on-chain.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] self-start">
          <button
            onClick={() => setTab("projects")}
            className={`px-3.5 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              tab === "projects"
                ? "bg-[var(--text-primary)] text-[var(--bg-canvas)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Top Apps
          </button>
          <button
            onClick={() => setTab("builders")}
            className={`px-3.5 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              tab === "builders"
                ? "bg-[var(--text-primary)] text-[var(--bg-canvas)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Top Builders
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-[var(--bg-surface)] border border-white/[0.08] overflow-x-auto">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
        {tab === "projects" ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-mono uppercase text-[var(--text-muted)]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Network</th>
                <th className="py-3 px-4 text-right">Market Cap</th>
                <th className="py-3 px-4 text-right">24h Volume</th>
                <th className="py-3 px-4 text-right">Holders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-[var(--text-muted)] font-mono text-xs">
                    Loading rankings...
                  </td>
                </tr>
              ) : topProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-[var(--text-secondary)]">
                    No apps indexed yet.{" "}
                    <Link href="/launch" className="text-[var(--accent-primary)] underline">
                      Launch an app
                    </Link>{" "}
                    to appear on the board.
                  </td>
                </tr>
              ) : (
                topProjects.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-elevated)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-muted)]">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/project/${p.chainId}/${p.tokenAddress}`}
                        className="flex items-center gap-2.5 hover:text-[var(--accent-primary)]"
                      >
                        <span className="font-display font-semibold text-white">{p.name}</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          ${p.symbol}
                        </span>
                        {p.isVerified && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]">
                            VERIFIED
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-secondary)]">
                      {getChainConfig(p.chainId)?.shortName ?? p.chainId}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-white">
                      {formatCompactNumber(p.marketCapEth)} ETH
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                      {formatEthValue(p.volume24hEth, 3)} ETH
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                      {p.holderCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-mono uppercase text-[var(--text-muted)]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Builder</th>
                <th className="py-3 px-4 text-right">Apps</th>
                <th className="py-3 px-4 text-right">Total Volume</th>
                <th className="py-3 px-4 text-right">Builder Fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
              {topBuilders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-[var(--text-secondary)]">
                    No builder fee history yet. Fees appear as soon as trades occur on a launched
                    app.
                  </td>
                </tr>
              ) : (
                topBuilders.map((b, idx) => (
                  <tr key={b.walletAddress} className="hover:bg-[var(--bg-elevated)]/60">
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-muted)]">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      {b.user?.displayName || shortenAddress(b.walletAddress, 6)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-white">
                      {b.projectCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                      {formatEthValue(b.totalVolumeEth, 3)} ETH
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-[var(--accent-primary)]">
                      {formatEthValue(b.totalCreatorFeeEth, 4)} ETH
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
