"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
      {/* Editorial Asymmetric Market Header — zero blur orbs, zero eyebrow pill, zero gradient text */}
      <section className="border-b border-[var(--border-subtle)] pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <h1 className="font-display font-bold text-4xl md:text-[52px] tracking-[-0.03em] leading-[1.04] text-white">
              Fund real apps from block one.
            </h1>
            <p className="mt-4 text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
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
                href="/litepaper"
                className="px-5 py-2.5 rounded-lg font-medium text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Read Litepaper
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-4 justify-end">
            <AsciiOrbitArt />
          </div>
        </div>

        {/* Protocol Spec / Live Ledger Strip */}
        <div className="mt-7 pt-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 font-mono text-xs tabular-nums text-[var(--text-muted)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>
              Supply <strong className="text-[var(--text-primary)] font-medium">1B fixed</strong>
            </span>
            <span>
              Builder fee{" "}
              <strong className="text-[var(--signal-emerald)] font-medium">0.5% ETH</strong>
            </span>
            <span>
              Graduation <strong className="text-[var(--text-primary)] font-medium">Auto DEX lock</strong>
            </span>
          </div>

          {hasRealActivity && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>
                Apps <strong className="text-white">{stats.totalProjects}</strong>
              </span>
              <span>
                Volume{" "}
                <strong className="text-white">{formatEthValue(stats.totalVolumeEth, 2)} ETH</strong>
              </span>
              <span>
                Paid to builders{" "}
                <strong className="text-[var(--signal-emerald)]">
                  {formatEthValue(stats.totalCreatorFeesEth, 3)} ETH
                </strong>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <input
            type="text"
            placeholder="Filter by app name, $TICKER, or contract address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md px-3.5 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-white placeholder:text-[var(--text-muted)] outline-none"
          />

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
