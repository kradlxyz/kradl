"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Coins, Rocket, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { KRADL_LAUNCHPAD_ABI, getChainConfig, getLaunchpadAddress } from "@kradl/shared";
import { formatEthValue, formatTokenAmount, parseRevertError, shortenAddress } from "@/lib/format";
import { ProjectCardData } from "@/components/ProjectCard";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const { openConnectModal } = useConnectModal();

  const [claimState, setClaimState] = useState<"idle" | "signing" | "pending" | "success" | "error">(
    "idle"
  );
  const [claimError, setClaimError] = useState<string | null>(null);

  const launchpadAddress = getLaunchpadAddress(chainId);
  const chainConfig = getChainConfig(chainId);

  // Live on-chain claimable creator fees on active network
  const { data: claimableWeiRaw, refetch: refetchClaimable } = useReadContract({
    address: launchpadAddress ?? undefined,
    abi: KRADL_LAUNCHPAD_ABI,
    functionName: "creatorFeesAccrued",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address && launchpadAddress) },
  });

  const claimableWei = (claimableWeiRaw as bigint | undefined) ?? 0n;

  const { data: userData } = useQuery({
    queryKey: ["user-dashboard", address],
    queryFn: async () => {
      const res = await fetch(`/api/users/${address}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(address),
  });

  async function handleClaimFees() {
    if (!launchpadAddress || claimableWei === 0n) return;
    setClaimError(null);
    try {
      setClaimState("signing");
      const hash = await writeContractAsync({
        address: launchpadAddress,
        abi: KRADL_LAUNCHPAD_ABI,
        functionName: "claimCreatorFees",
        chainId,
      });
      setClaimState("pending");
      await publicClient?.waitForTransactionReceipt({ hash });
      setClaimState("success");
      await refetchClaimable();
    } catch (err) {
      setClaimState("error");
      setClaimError(parseRevertError(err));
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="max-w-lg mx-auto my-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-10 text-center">
        <Wallet className="w-10 h-10 text-[var(--accent-primary)] mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-white">Creator & Portfolio Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Connect your wallet to claim builder trading fees, manage your launched apps, and track
          your on-chain portfolio.
        </p>
        <button
          onClick={() => openConnectModal?.()}
          className="mt-6 px-6 py-3 rounded-xl font-semibold text-sm bg-[var(--accent-primary)] text-[#07090E] hover:brightness-110 cursor-pointer"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const launchedProjects: ProjectCardData[] = userData?.launchedProjects ?? [];
  const holdings = userData?.holdings ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Builder Dashboard</h1>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
            Connected: {shortenAddress(address, 6)} • Active Network:{" "}
            <span className="text-[var(--accent-primary)]">
              {chainConfig?.name ?? `Chain ${chainId}`}
            </span>
          </p>
        </div>
        <Link
          href="/launch"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--accent-primary)] text-[#07090E] self-start"
        >
          <Rocket className="w-4 h-4" /> Launch New App
        </Link>
      </div>

      {/* Builder Revenue Panel */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] mb-2">
            <Coins className="w-4 h-4 text-[var(--accent-primary)]" />
            UNCLAIMED BUILDER FEES ({chainConfig?.shortName ?? `Chain ${chainId}`})
          </div>
          <div className="text-4xl md:text-5xl font-mono tabular-nums font-semibold text-white">
            {formatEthValue(claimableWei, 5)}{" "}
            <span className="text-lg text-[var(--text-muted)]">ETH</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Accumulated automatically from 0.5% of every buy and sell across all apps you launched on
            this chain.
          </p>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <button
            onClick={handleClaimFees}
            disabled={claimableWei === 0n || claimState === "signing" || claimState === "pending"}
            className="px-6 py-3 rounded-md font-semibold text-sm bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:brightness-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {claimState === "signing"
              ? "Confirm in Wallet..."
              : claimState === "pending"
                ? "Claiming On-Chain..."
                : "Claim Fees Now"}
          </button>

          {claimState === "success" && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fees sent to your wallet!
            </span>
          )}
          {claimState === "error" && claimError && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" /> {claimError}
            </span>
          )}
        </div>
      </div>

      {/* Launched Apps & Portfolio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <h2 className="font-display font-semibold text-base text-white mb-4">
            My Launched Apps ({launchedProjects.length})
          </h2>
          {launchedProjects.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">
              You haven&apos;t launched any apps yet.
            </p>
          ) : (
            <div className="space-y-3">
              {launchedProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/project/${p.chainId}/${p.tokenAddress}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-glow)] transition-colors"
                >
                  <div>
                    <div className="font-display font-semibold text-sm text-white">
                      {p.name}{" "}
                      <span className="font-mono text-xs text-[var(--accent-primary)]">
                        ${p.symbol}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                      {getChainConfig(p.chainId)?.shortName ?? p.chainId} •{" "}
                      {p.graduated ? "Graduated" : "Bonding Curve"}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="text-white">{formatEthValue(p.volume24hEth, 3)} ETH</div>
                    <div className="text-[var(--text-muted)]">24h Vol</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <h2 className="font-display font-semibold text-base text-white mb-4">
            My Token Portfolio ({holdings.length})
          </h2>
          {holdings.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">
              No Kradl project tokens held yet.
            </p>
          ) : (
            <div className="space-y-3">
              {holdings.map(
                (h: {
                  id: string;
                  balance: string;
                  project: {
                    chainId: number;
                    tokenAddress: string;
                    name: string;
                    symbol: string;
                    priceEth: number;
                  };
                }) => (
                  <Link
                    key={h.id}
                    href={`/project/${h.project.chainId}/${h.project.tokenAddress}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <div>
                      <div className="font-display font-semibold text-sm text-white">
                        {h.project.name}
                      </div>
                      <div className="font-mono text-xs text-[var(--accent-primary)]">
                        ${h.project.symbol}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs tabular-nums">
                      <div className="text-white font-semibold">
                        {formatTokenAmount(h.balance)} ${h.project.symbol}
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
