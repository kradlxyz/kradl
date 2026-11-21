"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther, decodeEventLog } from "viem";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Rocket, BadgeCheck, ExternalLink, Github, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  KRADL_LAUNCHPAD_ABI,
  PROJECT_CATEGORIES,
  ProjectCategory,
  getChainConfig,
  getLaunchpadAddress,
} from "@kradl/shared";
import { useKradlAuth } from "@/components/Providers";
import { parseRevertError } from "@/lib/format";

export default function LaunchPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const { openConnectModal } = useConnectModal();
  const { isAuthenticated, signIn } = useKradlAuth();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("AI & Agents");
  const [logoUrl, setLogoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [initialBuyEth, setInitialBuyEth] = useState("");

  const [status, setStatus] = useState<"idle" | "signing" | "confirming" | "saving" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chainConfig = getChainConfig(chainId);
  const launchpadAddress = getLaunchpadAddress(chainId);
  const willBeVerified = Boolean(liveUrl.trim() && githubUrl.includes("github.com"));

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!launchpadAddress) {
      setErrorMsg(
        `KradlLaunchpad is not configured for ${chainConfig?.name ?? `chain ${chainId}`}. Set NEXT_PUBLIC_LAUNCHPAD_ADDRESS_${chainId} in .env.`
      );
      setStatus("error");
      return;
    }

    try {
      if (!isAuthenticated) {
        const ok = await signIn();
        if (!ok) {
          setErrorMsg("Please sign the SIWE message to verify your builder identity.");
          setStatus("error");
          return;
        }
      }

      setStatus("signing");
      const buyWei =
        initialBuyEth && Number(initialBuyEth) > 0 ? parseEther(initialBuyEth) : 0n;

      const hash = await writeContractAsync({
        address: launchpadAddress,
        abi: KRADL_LAUNCHPAD_ABI,
        functionName: "launchProject",
        args: [name.trim(), symbol.trim().toUpperCase(), `kradl://${symbol.trim().toLowerCase()}`, 0n],
        value: buyWei,
        chainId,
      });

      setStatus("confirming");
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      let deployedTokenAddress: string | null = null;
      if (receipt) {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: KRADL_LAUNCHPAD_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "ProjectLaunched") {
              deployedTokenAddress = (decoded.args as { token: string }).token;
              break;
            }
          } catch {
            // ignore non-matching logs
          }
        }
      }

      if (deployedTokenAddress) {
        setStatus("saving");
        await fetch("/api/projects/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chainId,
            tokenAddress: deployedTokenAddress,
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            tagline: tagline.trim(),
            description: description.trim(),
            category,
            logoUrl: logoUrl.trim(),
            liveUrl: liveUrl.trim(),
            githubUrl: githubUrl.trim(),
            twitterUrl: twitterUrl.trim(),
          }),
        });
        router.push(`/project/${chainId}/${deployedTokenAddress.toLowerCase()}`);
      } else {
        router.push("/");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(parseRevertError(err));
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white">Launch Your App On-Chain</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Deploy a fair-launch 1B supply ERC-20 token on{" "}
          <span className="font-mono text-[var(--accent-primary)]">
            {chainConfig?.name ?? `Chain ${chainId}`}
          </span>{" "}
          and earn 0.5% of every trade automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <form
          onSubmit={handleLaunch}
          className="lg:col-span-7 space-y-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6"
        >
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-base text-white border-b border-[var(--border-subtle)] pb-2">
              1. App & Token Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Project / App Name *
                </label>
                <input
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kradl"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Token Ticker *
                </label>
                <input
                  required
                  maxLength={12}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="KRADL"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm font-mono uppercase text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                One-Line Pitch (Tagline) *
              </label>
              <input
                required
                minLength={4}
                maxLength={160}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Multi-chain EVM app & project launchpad with 0.5% ETH builder fees"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-white/[0.1] text-sm text-white outline-none cursor-pointer"
                >
                  {PROJECT_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#111114] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                Full Description *
              </label>
              <textarea
                required
                minLength={10}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what your app does, what stage it is in, and how builder fees will accelerate development..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm text-white outline-none resize-y"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display font-semibold text-base text-white border-b border-[var(--border-subtle)] pb-2">
              2. Builder Proof &amp; Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Live App / Demo URL
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://kradl.xyz"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/kradlxyz/kradl"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  X / Twitter URL
                </label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/kradlxyz"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Initial Creator Buy (ETH, Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialBuyEth}
                  onChange={(e) => setInitialBuyEth(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono text-white outline-none"
                />
              </div>
            </div>
          </div>

          {status === "error" && errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "signing" || status === "confirming" || status === "saving"}
            className="w-full py-3 rounded-md font-semibold text-sm bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:brightness-95 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            {!isConnected
              ? "Connect Wallet to Launch"
              : status === "signing"
                ? "Confirm Deployment in Wallet..."
                : status === "confirming"
                  ? "Deploying Smart Contract..."
                  : status === "saving"
                    ? "Saving App Showcase..."
                    : `Deploy $${symbol || "TOKEN"} on ${chainConfig?.shortName ?? "Chain"}`}
          </button>
        </form>

        {/* Live Card Preview & Guarantees */}
        <div className="lg:col-span-5 space-y-5 sticky top-24">
          <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Live Card Preview
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Preview"
                    className="w-11 h-11 rounded-md object-cover border border-[var(--border-strong)]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center font-mono font-semibold text-sm text-[var(--text-primary)]">
                    {(symbol || "KR").slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-semibold text-white">
                      {name || "Your App Name"}
                    </span>
                    {willBeVerified && (
                      <BadgeCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-[var(--accent-primary)]">
                      ${symbol || "TICKER"}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      {category}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                {chainConfig?.shortName ?? "EVM"}
              </span>
            </div>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {tagline || "Your concise one-line pitch will appear here."}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
              {liveUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                  <ExternalLink className="w-3 h-3" /> Live App
                </span>
              )}
              {githubUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                  <Github className="w-3 h-3" /> GitHub
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-2.5 text-xs text-[var(--text-secondary)]">
            <div className="font-display font-semibold text-sm text-white mb-2">
              Kradl Fair-Launch Guarantees
            </div>
            {[
              "Fixed 1,000,000,000 supply — zero hidden mint or blacklist",
              "0.5% of all trading volume streams to your Builder Dashboard in ETH",
              "Auto-graduates to locked DEX liquidity when bonding curve fills",
              "Include Live App + GitHub URL to unlock Verified Builder Badge",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
