"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useKradlAuth } from "./Providers";
import { KradlLogo } from "./KradlLogo";
import { formatEthValue, shortenAddress, timeAgo } from "@/lib/format";

interface TickerItem {
  id: string;
  chainId: number;
  tokenAddress: string;
  symbol: string;
  traderAddress: string;
  isBuy: boolean;
  ethAmount: string;
  timestamp: string;
}

const NAV_LINKS = [
  { href: "/", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
  { href: "/revenue", label: "Revenue" },
  { href: "/developers", label: "Developers" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, authError, signIn } = useKradlAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data } = useQuery<{ ticker: TickerItem[] }>({
    queryKey: ["kradl-ticker"],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=1");
      if (!res.ok) return { ticker: [] };
      return res.json();
    },
    refetchInterval: 8_000,
  });

  const tickerItems = data?.ticker ?? [];

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
      {/* Live Tape only renders when real on-chain trades exist */}
      {tickerItems.length > 0 && (
        <div className="h-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden flex items-center">
          <div className="shrink-0 px-3 h-full flex items-center gap-2 border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)] z-10">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--signal-emerald)]" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Live
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="animate-kradl-ticker flex items-center gap-6 px-4 text-xs font-mono tabular-nums">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  href={`/project/${item.chainId}/${item.tokenAddress}`}
                  className="inline-flex items-center gap-2 hover:text-white text-[var(--text-secondary)] transition-colors whitespace-nowrap"
                >
                  <span className="text-[var(--text-muted)]">
                    {shortenAddress(item.traderAddress, 3)}
                  </span>
                  <span
                    className={
                      item.isBuy
                        ? "text-[var(--trade-buy)] font-medium"
                        : "text-[var(--trade-sell)] font-medium"
                    }
                  >
                    {item.isBuy ? "BUY" : "SELL"}
                  </span>
                  <span className="text-[var(--text-primary)]">
                    {formatEthValue(item.ethAmount)} ETH
                  </span>
                  <span className="text-white">${item.symbol}</span>
                  <span className="text-[var(--text-muted)]">{timeAgo(item.timestamp)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <nav className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 group">
            <KradlLogo size={28} />
            <span className="font-display font-bold text-[17px] tracking-tight text-white">
              Kradl
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-[var(--bg-elevated)] text-white font-medium"
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isConnected && !isAuthenticated && (
            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg text-xs font-mono border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSigningIn ? "Signing..." : "Sign In"}
            </button>
          )}

          <Link
            href="/launch"
            className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:bg-zinc-200 transition-colors"
          >
            Launch App
          </Link>

          <div className="flex items-center [&_button]:!h-9 [&_button]:!rounded-lg [&_button]:!text-[13px]">
            <ConnectButton
              showBalance={{ smallScreen: false, largeScreen: true }}
              accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
              chainStatus={{ smallScreen: "icon", largeScreen: "name" }}
            />
          </div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Surface SIWE error banner if wallet signing fails */}
      {authError && (
        <div className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2 text-center text-xs font-mono text-rose-300">
          Sign In error: {authError}
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[var(--bg-elevated)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
