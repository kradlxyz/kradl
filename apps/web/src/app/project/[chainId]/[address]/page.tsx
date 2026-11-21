"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  BadgeCheck,
  Copy,
  Check,
  ExternalLink,
  Github,
  MessageSquare,
  Sparkles,
  Users,
  ArrowUpDown,
  FileText,
  Send,
} from "lucide-react";
import {
  getAddressExplorerUrl,
  getChainConfig,
  getCurveProgressBps,
  getTxExplorerUrl,
  TOTAL_SUPPLY,
} from "@kradl/shared";
import { PriceChart } from "@/components/PriceChart";
import { TradeTerminal } from "@/components/TradeTerminal";
import { EditProjectModal } from "@/components/EditProjectModal";
import { VestingVaultCard } from "@/components/VestingVaultCard";
import { useKradlAuth } from "@/components/Providers";
import { formatEthValue, formatTokenAmount, shortenAddress, timeAgo } from "@/lib/format";

type DetailTab = "overview" | "updates" | "discussion" | "trades" | "holders";

export default function ProjectDetailPage() {
  const params = useParams<{ chainId: string; address: string }>();
  const chainId = Number(params.chainId);
  const address = (params.address || "").toLowerCase() as `0x${string}`;
  const queryClient = useQueryClient();

  const { address: connectedAddress } = useAccount();
  const { isAuthenticated, signIn } = useKradlAuth();

  const [tab, setTab] = useState<DetailTab>("overview");
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creatorLocked, setCreatorLocked] = useState(false);

  // Comment & Update forms
  const [commentText, setCommentText] = useState("");
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: projectRes, isLoading } = useQuery({
    queryKey: ["project", chainId, address],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${chainId}/${address}`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 8_000,
  });

  const { data: updatesRes } = useQuery({
    queryKey: ["updates", chainId, address],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${chainId}/${address}/updates`);
      return res.ok ? res.json() : { updates: [] };
    },
    enabled: tab === "updates",
  });

  const { data: commentsRes } = useQuery({
    queryKey: ["comments", chainId, address],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${chainId}/${address}/comments`);
      return res.ok ? res.json() : { comments: [] };
    },
    enabled: tab === "discussion",
  });

  const { data: tradesRes } = useQuery({
    queryKey: ["trades", chainId, address],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${chainId}/${address}/trades`);
      return res.ok ? res.json() : { trades: [] };
    },
    enabled: tab === "trades",
    refetchInterval: 6_000,
  });

  const { data: holdersRes } = useQuery({
    queryKey: ["holders", chainId, address],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${chainId}/${address}/holders`);
      return res.ok ? res.json() : { holders: [] };
    },
    enabled: tab === "holders",
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        <div className="lg:col-span-8 h-[520px] rounded-2xl bg-[var(--bg-surface)]" />
        <div className="lg:col-span-4 h-[420px] rounded-2xl bg-[var(--bg-surface)]" />
      </div>
    );
  }

  const project = projectRes?.project;
  if (!project) {
    return (
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-12 text-center">
        <h2 className="font-display font-semibold text-xl text-white">Project Not Found</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          This token has not been indexed yet or does not exist on chain {chainId}.
        </p>
      </div>
    );
  }

  const chainConfig = getChainConfig(chainId);
  const explorerAddressUrl = getAddressExplorerUrl(chainId, address);
  const isCreator =
    Boolean(connectedAddress) && connectedAddress?.toLowerCase() === project.creatorAddress;

  const curveSnapshot = {
    virtualEthReserve: BigInt(project.virtualEthReserve || "1500000000000000000"),
    virtualTokenReserve: BigInt(project.virtualTokenReserve || "1073000000000000000000000000"),
    realEthReserve: BigInt(project.realEthReserve || "0"),
    realTokenReserve: BigInt(project.realTokenReserve || "800000000000000000000000000"),
    graduationThreshold: BigInt(project.graduationThreshold || "5000000000000000000"),
  };

  const progressBps = project.graduated ? 10_000 : getCurveProgressBps(curveSnapshot);
  const progressPct = (progressBps / 100).toFixed(1);

  async function handleCopyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      if (!isAuthenticated) {
        const ok = await signIn();
        if (!ok) return;
      }
      const res = await fetch(`/api/projects/${chainId}/${address}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: ["comments", chainId, address] });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePostUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateTitle.trim() || !updateContent.trim()) return;
    setSubmitting(true);
    try {
      if (!isAuthenticated) {
        const ok = await signIn();
        if (!ok) return;
      }
      const res = await fetch(`/api/projects/${chainId}/${address}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionTag: updateVersion,
          title: updateTitle,
          content: updateContent,
        }),
      });
      if (res.ok) {
        setUpdateVersion("");
        setUpdateTitle("");
        setUpdateContent("");
        queryClient.invalidateQueries({ queryKey: ["updates", chainId, address] });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN (68% -> 8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Project Header */}
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {project.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={project.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-strong)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00E5A0]/20 to-[#6366F1]/25 border border-[var(--border-strong)] flex items-center justify-center font-display font-bold text-2xl text-[var(--accent-primary)]">
                  {project.symbol.slice(0, 2)}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
                    {project.name}
                  </h1>
                  <span className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                    ${project.symbol}
                  </span>
                  {project.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[11px] font-mono text-[var(--accent-primary)]">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified Builder
                    </span>
                  )}
                  {creatorLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
                      Creator Locked
                    </span>
                  )}
                </div>

                <p className="text-sm text-[var(--text-secondary)] mt-1.5">{project.tagline}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {chainConfig?.name ?? `Chain ${chainId}`}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--border-subtle)] cursor-pointer"
                  >
                    {shortenAddress(address, 5)}
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {explorerAddressUrl && (
                    <a
                      href={explorerAddressUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-elevated)] hover:text-white text-[var(--text-muted)] border border-[var(--border-subtle)]"
                    >
                      Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Edit Details
                </button>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-[#07090E] hover:brightness-110"
                >
                  Visit Live App <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                  title="GitHub Repository"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {project.twitterUrl && (
                <a
                  href={project.twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-white"
                  title="X / Twitter"
                >
                  𝕏
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Candlestick Chart */}
        <PriceChart chainId={chainId} tokenAddress={address} symbol={project.symbol} />

        {/* Tabs */}
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-[var(--border-subtle)] overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "updates", label: `Updates (${project._count?.updates ?? 0})`, icon: Sparkles },
              {
                id: "discussion",
                label: `Discussion (${project._count?.comments ?? 0})`,
                icon: MessageSquare,
              },
              { id: "trades", label: `Trades (${project._count?.trades ?? 0})`, icon: ArrowUpDown },
              { id: "holders", label: `Holders (${project.holderCount ?? 0})`, icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as DetailTab)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                    tab === item.id
                      ? "border-[var(--accent-primary)] text-white"
                      : "border-transparent text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {tab === "overview" && (
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-base text-white">About {project.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {project.description || "No extended description provided by the builder yet."}
                </p>
              </div>
            )}

            {tab === "updates" && (
              <div className="space-y-5">
                {isCreator && (
                  <form
                    onSubmit={handlePostUpdate}
                    className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent-primary)]/30 space-y-3"
                  >
                    <div className="text-xs font-mono text-[var(--accent-primary)]">
                      Publish Build-in-Public Changelog
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        placeholder="v1.1"
                        value={updateVersion}
                        onChange={(e) => setUpdateVersion(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-white outline-none"
                      />
                      <input
                        required
                        placeholder="Milestone title..."
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                        className="sm:col-span-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-white outline-none"
                      />
                    </div>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share what you shipped this week..."
                      value={updateContent}
                      onChange={(e) => setUpdateContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[#07090E] cursor-pointer disabled:opacity-50"
                    >
                      Publish Update
                    </button>
                  </form>
                )}

                {(updatesRes?.updates ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-6">
                    No builder changelog updates published yet.
                  </p>
                ) : (
                  (updatesRes?.updates ?? []).map(
                    (u: {
                      id: string;
                      versionTag?: string | null;
                      title: string;
                      content: string;
                      createdAt: string;
                    }) => (
                      <div
                        key={u.id}
                        className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {u.versionTag && (
                              <span className="px-2 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-mono text-[11px]">
                                {u.versionTag}
                              </span>
                            )}
                            <h4 className="font-display font-semibold text-sm text-white">
                              {u.title}
                            </h4>
                          </div>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {timeAgo(u.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                          {u.content}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            )}

            {tab === "discussion" && (
              <div className="space-y-4">
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ask the builder or share feedback..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[#07090E] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>

                {(commentsRes?.comments ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-6">
                    No comments yet. Start the discussion!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(commentsRes?.comments ?? []).map(
                      (c: {
                        id: string;
                        authorAddress: string;
                        content: string;
                        createdAt: string;
                        isCreator: boolean;
                        isHolder: boolean;
                      }) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                        >
                          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-white">
                                {shortenAddress(c.authorAddress, 4)}
                              </span>
                              {c.isCreator && (
                                <span className="px-1.5 py-0.5 rounded bg-[var(--accent-secondary)]/20 text-indigo-300 text-[10px]">
                                  BUILDER
                                </span>
                              )}
                              {c.isHolder && (
                                <span className="px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] text-[10px]">
                                  HOLDER
                                </span>
                              )}
                            </div>
                            <span className="text-[var(--text-muted)]">
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">{c.content}</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "trades" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Trader</th>
                      <th className="pb-2 text-right">ETH</th>
                      <th className="pb-2 text-right">${project.symbol}</th>
                      <th className="pb-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {(tradesRes?.trades ?? []).map(
                      (t: {
                        id: string;
                        isBuy: boolean;
                        traderAddress: string;
                        ethAmount: string;
                        tokenAmount: string;
                        txHash: string;
                        timestamp: string;
                      }) => {
                        const txUrl = getTxExplorerUrl(chainId, t.txHash);
                        return (
                          <tr key={t.id}>
                            <td
                              className={`py-2.5 font-semibold ${
                                t.isBuy ? "text-[var(--trade-buy)]" : "text-[var(--trade-sell)]"
                              }`}
                            >
                              {t.isBuy ? "BUY" : "SELL"}
                            </td>
                            <td className="py-2.5 text-[var(--text-secondary)]">
                              {shortenAddress(t.traderAddress, 4)}
                            </td>
                            <td className="py-2.5 text-right text-white">
                              {formatEthValue(t.ethAmount, 4)}
                            </td>
                            <td className="py-2.5 text-right text-[var(--text-secondary)]">
                              {formatTokenAmount(t.tokenAmount)}
                            </td>
                            <td className="py-2.5 text-right text-[var(--text-muted)]">
                              {txUrl ? (
                                <a
                                  href={txUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-white underline"
                                >
                                  {timeAgo(t.timestamp)}
                                </a>
                              ) : (
                                timeAgo(t.timestamp)
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "holders" && (
              <div className="space-y-2 text-xs font-mono tabular-nums">
                {(holdersRes?.holders ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-6 font-sans">
                    No holders indexed yet.
                  </p>
                ) : (
                  (holdersRes?.holders ?? []).map(
                    (h: { id: string; walletAddress: string; balance: string }, idx: number) => {
                      const pct = Number((BigInt(h.balance) * 10_000n) / TOTAL_SUPPLY) / 100;
                      return (
                        <div
                          key={h.id}
                          className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)]">#{idx + 1}</span>
                            <span className="text-white">{shortenAddress(h.walletAddress, 6)}</span>
                            {h.walletAddress === project.creatorAddress && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                                BUILDER
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-white">{formatTokenAmount(h.balance)}</span>
                            <span className="text-[var(--text-muted)] ml-2">
                              ({pct.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT STICKY SIDEBAR (32% -> 4 cols) */}
      <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-28">
        <TradeTerminal
          chainId={chainId}
          tokenAddress={address}
          symbol={project.symbol}
          graduated={project.graduated}
          curve={curveSnapshot}
          onTradeSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["project", chainId, address] });
            queryClient.invalidateQueries({ queryKey: ["candles", chainId, address] });
            queryClient.invalidateQueries({ queryKey: ["trades", chainId, address] });
          }}
        />

        {/* Bonding Curve Progress Card */}
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-[var(--text-secondary)]">
              {project.graduated ? "Graduated to DEX" : "Bonding Curve Progress"}
            </span>
            <span className="text-[var(--signal-emerald)] font-semibold">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--signal-emerald)] transition-all duration-300"
              style={{ width: `${Math.min(100, Number(progressPct))}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>Raised: {formatEthValue(curveSnapshot.realEthReserve)} ETH</span>
            <span>Target: {formatEthValue(curveSnapshot.graduationThreshold)} ETH</span>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
            When the target is reached, 98% of raised ETH + 200M reserved tokens automatically
            graduate to permanently locked DEX liquidity.
          </p>
        </div>

        {/* Trust & Safety Scanner Card */}
        {projectRes?.trustReport && (
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-sm text-white">
                Trust &amp; Safety Scan
              </span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                  projectRes.trustReport.riskLevel === "low"
                    ? "bg-emerald-500/12 text-emerald-400"
                    : projectRes.trustReport.riskLevel === "elevated"
                      ? "bg-rose-500/15 text-rose-300"
                      : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {projectRes.trustReport.riskLevel} risk
              </span>
            </div>

            <div className="space-y-1.5 font-mono tabular-nums pt-1 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Builder holds</span>
                <span className="text-white">
                  {projectRes.trustReport.builderHoldingPct.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Top 10 holders</span>
                <span
                  className={
                    projectRes.trustReport.isConcentrated ? "text-rose-300" : "text-white"
                  }
                >
                  {projectRes.trustReport.top10ConcentrationPct.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <span className="text-emerald-400">✓ Fixed 1B supply</span>
              <span className="text-emerald-400">✓ No mint / tax</span>
              <span
                className={
                  projectRes.trustReport.checks.liveAppVerified
                    ? "text-emerald-400"
                    : "text-[var(--text-muted)]"
                }
              >
                {projectRes.trustReport.checks.liveAppVerified ? "✓" : "○"} Live app URL
              </span>
              <span
                className={
                  projectRes.trustReport.checks.githubVerified
                    ? "text-emerald-400"
                    : "text-[var(--text-muted)]"
                }
              >
                {projectRes.trustReport.checks.githubVerified ? "✓" : "○"} GitHub repo
              </span>
              <span className={creatorLocked ? "text-emerald-400" : "text-[var(--text-muted)]"}>
                {creatorLocked ? "✓" : "○"} Vesting lock
              </span>
            </div>
          </div>
        )}

        {/* Creator Vesting Vault Card */}
        <VestingVaultCard
          chainId={chainId}
          tokenAddress={address}
          symbol={project.symbol}
          creatorAddress={project.creatorAddress}
          onCreatorLockedChange={setCreatorLocked}
        />

        {/* Builder Info Card */}
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-2.5 text-xs">
          <div className="font-display font-semibold text-sm text-white">Builder Stats</div>
          <div className="flex justify-between font-mono">
            <span className="text-[var(--text-muted)]">Builder Wallet</span>
            <span className="text-white">{shortenAddress(project.creatorAddress, 5)}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[var(--text-muted)]">Builder Fees Earned</span>
            <span className="text-emerald-400 font-semibold">
              {formatEthValue(project.totalCreatorFeeEth, 4)} ETH
            </span>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["project", chainId, address] });
          }}
        />
      )}
    </div>
  );
}
