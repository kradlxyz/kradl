"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Layers, Search } from "lucide-react";
import { PROJECT_CATEGORIES } from "@kradl/shared";
import { ProjectCard, ProjectCardData } from "@/components/ProjectCard";
import { AsciiOrbitArt } from "@/components/AsciiOrbitArt";
import { formatEthValue } from "@/lib/format";

interface ProjectsResponse {
  projects: ProjectCardData[];
  stats: {
    totalProjects: number;
    totalVolumeEth: number;
    totalCreatorFeesEth: number;
  };
}

const CHAIN_FILTERS = [
  { id: "mainnet", label: "All Mainnets" },
  { id: "4663", label: "Robinhood Chain" },
  { id: "8453", label: "Base" },
  { id: "46630", label: "Robinhood Testnet" },
];

export default function ExplorePage() {
  const [chainId, setChainId] = useState("mainnet");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("trending");
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data, isLoading } = useQuery<ProjectsResponse>({
    queryKey: ["projects", chainId, category, status, sort, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        chainId,
        category,
        status,
        sort,
        search,
      });
      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) {
        return {
          projects: [],
          stats: { totalProjects: 0, totalVolumeEth: 0, totalCreatorFeesEth: 0 },
        };
      }
      return res.json();
    },
    refetchInterval: 10_000,
  });

  const projects = data?.projects ?? [];
  const stats = data?.stats ?? { totalProjects: 0, totalVolumeEth: 0, totalCreatorFeesEth: 0 };
  const hasRealActivity = stats.totalProjects > 0;

  return (
    <div className="space-y-10">
      {/* Architectural Hero with subtle dot-grid backdrop + frameless kinetic ASCII K emblem */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[var(--bg-surface)]/70 p-6 sm:p-9">
        {/* Specular top hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        {/* Subtle dot-grid architectural canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Restrained emerald corner depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.09] text-[11px] font-mono text-[var(--text-secondary)] mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white">Robinhood Chain · 4663</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span>Mainnet Live</span>
            </div>

            <h1 className="font-display font-bold text-4xl md:text-[52px] tracking-[-0.03em] leading-[1.04] text-white">
              Fund real apps from block one.
            </h1>
            <p className="mt-4 text-base text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Kradl is a bonding-curve launchpad for working software on Robinhood Chain and Base.
              Every buy and sell routes 0.5% in ETH directly to the developer, with automatic DEX
              graduation once the curve fills.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/launch"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:bg-zinc-200 transition-colors"
              >
                Launch an app
              </Link>
              <Link
                href="/leaderboard"
                className="px-5 py-2.5 rounded-lg font-medium text-sm bg-white/[0.04] text-[var(--text-primary)] border border-white/[0.12] hover:bg-white/[0.08] transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-5 justify-end pr-2">
            <AsciiOrbitArt />
          </div>
        </div>

        {/* Hairline 5-Column Protocol Telemetry Strip */}
        <div className="relative mt-8 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono tabular-nums">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Token Supply
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              1B <span className="text-[var(--text-muted)] font-normal">fixed</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Builder Fee
            </div>
            <div className="text-sm font-semibold text-emerald-400 mt-0.5">
              0.5% <span className="text-[var(--text-muted)] font-normal">ETH</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Graduation LP
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Burned <span className="text-[var(--text-muted)] font-normal">0x…dEaD</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Mainnet Apps
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              {hasRealActivity ? stats.totalProjects : "Genesis"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Paid to Builders
            </div>
            <div className="text-sm font-semibold text-emerald-400 mt-0.5">
              {hasRealActivity ? `${formatEthValue(stats.totalCreatorFeesEth, 4)} ETH` : "0.5% live"}
            </div>
          </div>
        </div>
      </section>

      {/* Dual Mode-Selector Cards (FloatLaunch-inspired tactile filter cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setStatus("all")}
          className={`relative overflow-hidden text-left rounded-xl p-4 border transition-all cursor-pointer ${
            status === "all"
              ? "bg-[var(--bg-surface)] border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.25)]"
              : "bg-[var(--bg-surface)]/50 border-white/[0.07] hover:border-white/[0.15]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 font-display font-semibold text-sm text-white">
              <Layers className="w-4 h-4 text-zinc-300" />
              All Mainnet Launches
            </div>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/[0.06] text-[var(--text-secondary)]">
              Permissionless
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Every fair-launch app token trading on Kradl bonding curves &amp; graduated Uniswap pools.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatus(status === "verified" ? "all" : "verified")}
          className={`relative overflow-hidden text-left rounded-xl p-4 border transition-all cursor-pointer ${
            status === "verified"
              ? "bg-[var(--bg-surface)] border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.25)]"
              : "bg-[var(--bg-surface)]/50 border-white/[0.07] hover:border-white/[0.15]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 font-display font-semibold text-sm text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Builders
            </div>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/12 text-emerald-400">
              Live App + GitHub
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Filtered to real software with verified Live App URLs, GitHub repositories, and anti-rug locks.
          </p>
        </button>
      </section>

      {/* Filter & Universal Scanner Toolbar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search app name, $TICKER, or 0x address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2 rounded-lg bg-[var(--bg-surface)] border border-white/[0.08] focus:border-white/[0.22] text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-colors"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2">
              /
            </kbd>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by blockchain"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="px-3 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {CHAIN_FILTERS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#121417]">
                  {c.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setStatus(status === "verified" ? "all" : "verified")}
              className={`px-3 py-2 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                status === "verified"
                  ? "bg-[var(--accent-primary)]/12 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Verified only
            </button>

            <select
              aria-label="Sort projects"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="trending" className="bg-[#121417]">
                Sort: Trending
              </option>
              <option value="newest" className="bg-[#121417]">
                Sort: Newest
              </option>
              <option value="mcap" className="bg-[#121417]">
                Sort: Market cap
              </option>
              <option value="volume" className="bg-[#121417]">
                Sort: Volume
              </option>
            </select>
          </div>
        </div>

        {/* Category Tabs (sharp underlined/boxed tabs, not generic pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", ...PROJECT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                category === cat
                  ? "bg-[var(--text-primary)] text-[var(--bg-canvas)] font-semibold"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Project Directory Grid */}
      <section>
        {isLoading ? (
          <div className="py-12 font-mono text-xs text-[var(--text-muted)]">
            Loading indexed apps...
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-display font-semibold text-lg text-white">
                No apps match this filter yet
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-lg">
                Connect a wallet and deploy the first app token on Robinhood Chain Testnet or Base
                Sepolia, or clear your active filters.
              </p>
            </div>
            <Link
              href="/launch"
              className="shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:bg-zinc-200 transition-colors self-start sm:self-center"
            >
              Launch first app
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
