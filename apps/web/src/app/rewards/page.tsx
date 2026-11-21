"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, ExternalLink, Gift, Users, Award, ShieldCheck } from "lucide-react";
import { getAddressExplorerUrl, getMerkleDistributorAddress } from "@kradl/shared";
import { useKradlAuth } from "@/components/Providers";
import { shortenAddress } from "@/lib/format";

interface LeaderboardRow {
  rank: number;
  walletAddress: string;
  tier: string;
  launchPoints: number;
  updatePoints: number;
  tradingPoints: number;
  earlySupporterPoints: number;
  referralPoints: number;
  totalPoints: number;
  launchesCount: number;
  tradesCount: number;
  activeReferralsCount: number;
  pendingReferralsCount: number;
}

interface RewardsResponse {
  season: string;
  totalParticipants: number;
  totalPointsDistributed: number;
  leaderboard: LeaderboardRow[];
  wallet: (LeaderboardRow & { rank: number | null; referredBy: string | null }) | null;
}

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, signIn } = useKradlAuth();
  const queryClient = useQueryClient();

  const [copiedLink, setCopiedLink] = useState(false);
  const [referrerInput, setReferrerInput] = useState("");
  const [refStatus, setRefStatus] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [binding, setBinding] = useState(false);

  const { data, isLoading } = useQuery<RewardsResponse>({
    queryKey: ["kradl-rewards", address?.toLowerCase() ?? "anon"],
    queryFn: async () => {
      const qs = address ? `?address=${encodeURIComponent(address)}` : "";
      const res = await fetch(`/api/rewards${qs}`);
      if (!res.ok) throw new Error("Failed to load rewards");
      return res.json();
    },
    refetchInterval: 15_000,
  });

  const distributorAddress = getMerkleDistributorAddress(4663);
  const distributorExplorer = distributorAddress
    ? getAddressExplorerUrl(4663, distributorAddress)
    : null;

  const referralLink = address
    ? `https://kradl.xyz/?ref=${address.toLowerCase()}`
    : "Connect wallet to generate link";

  async function handleCopyRef() {
    if (!address) return;
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  }

  async function handleBindReferral(e: React.FormEvent) {
    e.preventDefault();
    if (!referrerInput.trim()) return;
    setBinding(true);
    setRefStatus(null);
    setRefError(null);
    try {
      if (!isAuthenticated) {
        const ok = await signIn();
        if (!ok) {
          setRefError("Please sign in with your wallet first.");
          return;
        }
      }
      const res = await fetch("/api/rewards/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerAddress: referrerInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRefError(json.error || "Could not bind referrer.");
        return;
      }
      setReferrerInput("");
      setRefStatus("Referrer bound on-chain identity.");
      queryClient.invalidateQueries({ queryKey: ["kradl-rewards"] });
    } finally {
      setBinding(false);
    }
  }

  const wallet = data?.wallet;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-400 mb-3">
            <Gift className="w-3.5 h-3.5" />
            {data?.season ?? "Season 1 · Mainnet Genesis"}
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight">
            Rewards &amp; Airdrop Portal
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl">
            Earn deterministic Season 1 points from verified app launches, on-chain trading volume,
            and active builder referrals. Points snapshot directly into our trustless{" "}
            <span className="font-mono text-white">KradlMerkleDistributor</span> airdrop campaigns.
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono tabular-nums text-xs">
          <div>
            <div className="text-[var(--text-muted)]">Participants</div>
            <div className="text-lg font-semibold text-white mt-0.5">
              {data?.totalParticipants ?? 0}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)]">Total Points</div>
            <div className="text-lg font-semibold text-emerald-400 mt-0.5">
              {(data?.totalPointsDistributed ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Top 2-Column Cards: My Rewards + Referral / Merkle Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Connected Wallet Points Breakdown */}
        <div className="lg:col-span-7 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h2 className="font-display font-semibold text-base text-white">
                Your Season 1 Standing
              </h2>
            </div>
            {wallet && (
              <span className="px-2.5 py-0.5 rounded font-mono text-[11px] bg-white/10 text-white">
                {wallet.tier} Tier {wallet.rank ? `· #${wallet.rank}` : ""}
              </span>
            )}
          </div>

          {!isConnected ? (
            <p className="text-sm text-[var(--text-muted)] py-6">
              Connect your wallet to inspect your Season 1 points, referral link, and Merkle airdrop
              eligibility.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-muted)]">Total Points</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {(wallet?.totalPoints ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-muted)]">App Launches</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {(wallet?.launchPoints ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-muted)]">Trading &amp; Early</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {(
                      (wallet?.tradingPoints ?? 0) + (wallet?.earlySupporterPoints ?? 0)
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-muted)]">Referrals</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {(wallet?.referralPoints ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <div>• Verified app launch: +1,000 pts</div>
                <div>• Changelog update (cap 10/app): +50 pts</div>
                <div>• Trading volume: +100 pts / 0.01 ETH</div>
                <div>• Early supporter (unique app): +150 pts</div>
                <div>• Active referral: +250 pts + 15% trade pts</div>
                <div className="text-emerald-400">✓ Anti-Sybil: active on-chain wallets only</div>
              </div>
            </>
          )}
        </div>

        {/* Right: Referral Link + Merkle Airdrop Status */}
        <div className="lg:col-span-5 space-y-5">
          {/* Referral Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <h2 className="font-display font-semibold text-sm text-white">
                  Invite Builders &amp; Traders
                </h2>
              </div>
              {wallet && (
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {wallet.activeReferralsCount} active · {wallet.pendingReferralsCount} pending
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] outline-none"
              />
              <button
                type="button"
                disabled={!address}
                onClick={handleCopyRef}
                className="h-9 px-3 rounded-lg bg-white text-[#09090B] font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-zinc-200 cursor-pointer disabled:opacity-40"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>

            {isConnected && !wallet?.referredBy && (
              <form onSubmit={handleBindReferral} className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <div className="text-[11px] text-[var(--text-muted)]">
                  Have a referrer address? Bind once to credit them when you trade or launch:
                </div>
                <div className="flex gap-2">
                  <input
                    value={referrerInput}
                    onChange={(e) => setReferrerInput(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={binding || !referrerInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-medium text-white hover:bg-white/10 cursor-pointer disabled:opacity-40"
                  >
                    {binding ? "Saving..." : "Apply"}
                  </button>
                </div>
                {refStatus && <p className="text-[11px] font-mono text-emerald-400">{refStatus}</p>}
                {refError && <p className="text-[11px] font-mono text-rose-400">{refError}</p>}
              </form>
            )}

            {wallet?.referredBy && (
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Referred by <span className="text-white">{shortenAddress(wallet.referredBy, 5)}</span>
              </div>
            )}
          </div>

          {/* Merkle Airdrop Distributor Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-semibold text-sm text-white">
                  On-Chain Merkle Airdrop Vault
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-emerald-500/12 text-emerald-400">
                Season 1 Open
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Season 1 Testnet points are actively accumulating. At the end of Season 1, the Merkle
              root is published directly to{" "}
              <span className="font-mono text-white">KradlMerkleDistributor</span> for 1-click
              trustless claiming.
            </p>
            {distributorExplorer && (
              <a
                href={distributorExplorer}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Distributor Contract ({shortenAddress(distributorAddress!, 5)}){" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Season 1 Points Leaderboard */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="font-display font-semibold text-base text-white">
            Season 1 Points Leaderboard
          </h2>
          <span className="text-xs font-mono text-[var(--text-muted)]">Top 50 Wallets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <th className="py-3 px-5">Rank</th>
                <th className="py-3 px-4">Wallet</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4 text-right">Launches</th>
                <th className="py-3 px-4 text-right">Trades</th>
                <th className="py-3 px-4 text-right">Active Refs</th>
                <th className="py-3 px-5 text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    Loading Season 1 leaderboard...
                  </td>
                </tr>
              ) : (data?.leaderboard ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    No activity indexed yet. Launch an app or trade to claim #1.
                  </td>
                </tr>
              ) : (
                (data?.leaderboard ?? []).map((row) => (
                  <tr key={row.walletAddress} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-5 text-[var(--text-muted)]">#{row.rank}</td>
                    <td className="py-3 px-4 text-white">
                      {shortenAddress(row.walletAddress, 6)}
                      {address?.toLowerCase() === row.walletAddress && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px]">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{row.tier}</td>
                    <td className="py-3 px-4 text-right text-white">{row.launchesCount}</td>
                    <td className="py-3 px-4 text-right text-white">{row.tradesCount}</td>
                    <td className="py-3 px-4 text-right text-white">{row.activeReferralsCount}</td>
                    <td className="py-3 px-5 text-right font-semibold text-emerald-400">
                      {row.totalPoints.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
