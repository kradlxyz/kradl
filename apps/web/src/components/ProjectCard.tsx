"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getChainConfig, getCurveProgressBps } from "@kradl/shared";
import { formatCompactNumber, formatEthValue } from "@/lib/format";

export interface ProjectCardData {
  id: string;
  chainId: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  tagline: string;
  category: string;
  logoUrl?: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  isVerified: boolean;
  graduated: boolean;
  realEthReserve: string;
  graduationThreshold: string;
  virtualEthReserve: string;
  virtualTokenReserve: string;
  realTokenReserve: string;
  marketCapEth: number;
  volume24hEth: number;
  priceChange24h: number;
  holderCount: number;
  launchedAt?: string;
  sparkline?: number[];
}

function MiniSparkline({ points, positive }: { points: number[]; positive: boolean }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 96;
  const h = 28;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline
        fill="none"
        stroke={positive ? "#10B981" : "#EF4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords}
      />
    </svg>
  );
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const [copied, setCopied] = useState(false);
  const chain = getChainConfig(project.chainId);
  const progressBps = project.graduated
    ? 10_000
    : getCurveProgressBps({
        virtualEthReserve: BigInt(project.virtualEthReserve || "0"),
        virtualTokenReserve: BigInt(project.virtualTokenReserve || "1"),
        realEthReserve: BigInt(project.realEthReserve || "0"),
        realTokenReserve: BigInt(project.realTokenReserve || "0"),
        graduationThreshold: BigInt(project.graduationThreshold || "1"),
      });
  const progressPct = (progressBps / 100).toFixed(1);
  const isPositive = project.priceChange24h >= 0;
  const isNew =
    project.launchedAt &&
    Date.now() - new Date(project.launchedAt).getTime() < 24 * 60 * 60 * 1000;

  async function handleCopyCA(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(project.tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <Link
      href={`/project/${project.chainId}/${project.tokenAddress}`}
      className="group flex flex-col justify-between rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] p-5 transition-colors"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {project.logoUrl ? (
              <img
                src={project.logoUrl}
                alt={project.name}
                className="w-11 h-11 rounded-md object-cover border border-[var(--border-subtle)] shrink-0 bg-[var(--bg-elevated)]"
              />
            ) : (
              <div className="w-11 h-11 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 font-mono font-semibold text-sm text-[var(--text-primary)]">
                {project.symbol.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-display font-semibold text-base text-[var(--text-primary)] truncate group-hover:text-white">
                  {project.name}
                </h3>
                {project.isVerified && (
                  <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    VERIFIED
                  </span>
                )}
                {isNew && (
                  <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className="font-mono text-[var(--text-primary)]">${project.symbol}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-muted)]">{project.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyCA}
              title={`Copy contract address ${project.tokenAddress}`}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-white cursor-pointer"
            >
              {copied ? "COPIED" : "CA"}
            </button>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {chain?.shortName ?? `Chain ${project.chainId}`}
            </span>
          </div>
        </div>

        <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {project.tagline || "Fair-launch application token on Kradl."}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
            {project.liveUrl && <span>Live App</span>}
            {project.githubUrl && <span>GitHub</span>}
          </div>
          {project.sparkline && project.sparkline.length >= 2 && (
            <MiniSparkline points={project.sparkline} positive={isPositive} />
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
        <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-xs">
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">MCap</div>
            <div className="font-medium text-[var(--text-primary)] mt-0.5">
              {formatCompactNumber(project.marketCapEth)} ETH
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">24h</div>
            <div
              className={`font-medium mt-0.5 ${
                isPositive ? "text-[var(--trade-buy)]" : "text-[var(--trade-sell)]"
              }`}
            >
              {isPositive ? "+" : ""}
              {project.priceChange24h.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[var(--text-muted)]">24h Vol</div>
            <div className="font-medium text-[var(--text-primary)] mt-0.5">
              {formatEthValue(project.volume24hEth, 3)} ETH
            </div>
          </div>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums mb-1.5">
            <span className="text-[var(--text-muted)]">
              {project.graduated ? "Graduated to DEX" : "Curve progress"}
            </span>
            <span className="text-[var(--text-primary)]">{progressPct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--signal-emerald)] transition-all duration-300"
              style={{ width: `${Math.min(100, Number(progressPct))}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
