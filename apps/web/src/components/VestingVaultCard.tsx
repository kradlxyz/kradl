"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";
import { Lock, ShieldCheck, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import {
  getAddressExplorerUrl,
  getVestingVaultAddress,
  KRADL_TOKEN_ABI,
  KRADL_VESTING_VAULT_ABI,
  TOTAL_SUPPLY,
} from "@kradl/shared";
import { formatTokenAmount, shortenAddress } from "@/lib/format";

interface VestingVaultCardProps {
  chainId: number;
  tokenAddress: `0x${string}`;
  symbol: string;
  creatorAddress: string;
  onCreatorLockedChange?: (locked: boolean) => void;
}

const VESTING_PRESETS = [
  { id: "30d-180d", label: "30d cliff · 6m linear", cliffDays: 30, durationDays: 180 },
  { id: "90d-365d", label: "90d cliff · 12m linear", cliffDays: 90, durationDays: 365 },
  { id: "0d-90d", label: "No cliff · 3m linear", cliffDays: 0, durationDays: 90 },
] as const;

export function VestingVaultCard({
  chainId,
  tokenAddress,
  symbol,
  creatorAddress,
  onCreatorLockedChange,
}: VestingVaultCardProps) {
  const vaultAddress = getVestingVaultAddress(chainId);
  const { address: connectedAddress, chainId: walletChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId });

  const isCreator =
    Boolean(connectedAddress) && connectedAddress?.toLowerCase() === creatorAddress.toLowerCase();

  const [showLockForm, setShowLockForm] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [presetId, setPresetId] = useState<(typeof VESTING_PRESETS)[number]["id"]>("30d-180d");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: lockIds, refetch: refetchLockIds } = useReadContract({
    chainId,
    address: vaultAddress ?? undefined,
    abi: KRADL_VESTING_VAULT_ABI,
    functionName: "getTokenLockIds",
    args: [tokenAddress],
    query: { enabled: Boolean(vaultAddress) },
  });

  const ids = useMemo(() => (lockIds as readonly bigint[] | undefined) ?? [], [lockIds]);

  const { data: lockDetails, refetch: refetchLockDetails } = useReadContracts({
    contracts: ids.flatMap((id) => [
      {
        chainId,
        address: vaultAddress!,
        abi: KRADL_VESTING_VAULT_ABI,
        functionName: "locks" as const,
        args: [id] as const,
      },
      {
        chainId,
        address: vaultAddress!,
        abi: KRADL_VESTING_VAULT_ABI,
        functionName: "claimableAmount" as const,
        args: [id] as const,
      },
    ]),
    query: { enabled: Boolean(vaultAddress) && ids.length > 0 },
  });

  const { data: creatorTokenBalance, refetch: refetchBalance } = useReadContract({
    chainId,
    address: tokenAddress,
    abi: KRADL_TOKEN_ABI,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: { enabled: Boolean(connectedAddress && isCreator) },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    chainId,
    address: tokenAddress,
    abi: KRADL_TOKEN_ABI,
    functionName: "allowance",
    args: connectedAddress && vaultAddress ? [connectedAddress, vaultAddress] : undefined,
    query: { enabled: Boolean(connectedAddress && vaultAddress && isCreator) },
  });

  const parsedLocks = useMemo(() => {
    if (!lockDetails || ids.length === 0) return [];
    const list: {
      id: bigint;
      beneficiary: string;
      totalAmount: bigint;
      claimedAmount: bigint;
      remaining: bigint;
      claimable: bigint;
      startTime: number;
      cliffDuration: number;
      duration: number;
    }[] = [];

    for (let i = 0; i < ids.length; i++) {
      const lockRes = lockDetails[i * 2]?.result as
        | readonly [string, string, bigint, bigint, bigint, bigint, bigint]
        | undefined;
      const claimableRes = (lockDetails[i * 2 + 1]?.result as bigint | undefined) ?? 0n;
      if (!lockRes) continue;
      const totalAmount = lockRes[2];
      const claimedAmount = lockRes[3];
      const remaining = totalAmount > claimedAmount ? totalAmount - claimedAmount : 0n;
      list.push({
        id: ids[i],
        beneficiary: lockRes[1],
        totalAmount,
        claimedAmount,
        remaining,
        claimable: claimableRes,
        startTime: Number(lockRes[4]),
        cliffDuration: Number(lockRes[5]),
        duration: Number(lockRes[6]),
      });
    }
    return list;
  }, [ids, lockDetails]);

  const totalRemainingLocked = useMemo(
    () => parsedLocks.reduce((acc, item) => acc + item.remaining, 0n),
    [parsedLocks]
  );

  const hasCreatorLock = useMemo(
    () =>
      parsedLocks.some(
        (l) => l.remaining > 0n && l.beneficiary.toLowerCase() === creatorAddress.toLowerCase()
      ),
    [parsedLocks, creatorAddress]
  );

  useEffect(() => {
    onCreatorLockedChange?.(hasCreatorLock);
  }, [hasCreatorLock, onCreatorLockedChange]);

  if (!vaultAddress) return null;

  const lockedPct = Number((totalRemainingLocked * 10_000n) / TOTAL_SUPPLY) / 100;
  const vaultExplorerUrl = getAddressExplorerUrl(chainId, vaultAddress);
  const selectedPreset = VESTING_PRESETS.find((p) => p.id === presetId) ?? VESTING_PRESETS[0];

  let parsedAmountWei = 0n;
  try {
    if (amountInput && Number(amountInput) > 0) {
      parsedAmountWei = parseUnits(amountInput, 18);
    }
  } catch {
    parsedAmountWei = 0n;
  }

  const allowanceWei = (currentAllowance as bigint | undefined) ?? 0n;
  const balanceWei = (creatorTokenBalance as bigint | undefined) ?? 0n;
  const needsApproval = parsedAmountWei > 0n && allowanceWei < parsedAmountWei;

  async function ensureChain() {
    if (walletChainId !== chainId) {
      await switchChainAsync({ chainId });
    }
  }

  async function handleLockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connectedAddress || !vaultAddress || parsedAmountWei <= 0n) return;
    if (parsedAmountWei > balanceWei) {
      setErrorMsg(`Insufficient $${symbol} balance.`);
      return;
    }

    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      await ensureChain();

      if (needsApproval) {
        setStatusMsg(`Approving $${symbol} for KradlVestingVault...`);
        const approveHash = await writeContractAsync({
          chainId,
          address: tokenAddress,
          abi: KRADL_TOKEN_ABI,
          functionName: "approve",
          args: [vaultAddress, parsedAmountWei],
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
        await refetchAllowance();
      }

      const cliffSeconds = BigInt(selectedPreset.cliffDays * 86_400);
      const durationSeconds = BigInt(selectedPreset.durationDays * 86_400);

      setStatusMsg("Creating immutable on-chain vesting lock...");
      const lockHash = await writeContractAsync({
        chainId,
        address: vaultAddress,
        abi: KRADL_VESTING_VAULT_ABI,
        functionName: "createLock",
        args: [tokenAddress, connectedAddress, parsedAmountWei, cliffSeconds, durationSeconds],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: lockHash });
      }

      setAmountInput("");
      setShowLockForm(false);
      setStatusMsg("Tokens locked on-chain in KradlVestingVault.");
      await Promise.all([refetchLockIds(), refetchLockDetails(), refetchBalance()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 140) : "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(lockId: bigint) {
    if (!vaultAddress) return;
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await ensureChain();
      setStatusMsg("Claiming vested tokens...");
      const hash = await writeContractAsync({
        chainId,
        address: vaultAddress,
        abi: KRADL_VESTING_VAULT_ABI,
        functionName: "claim",
        args: [lockId],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setStatusMsg("Vested tokens claimed.");
      await Promise.all([refetchLockDetails(), refetchBalance()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 140) : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  function setPercentAmount(pct: number) {
    if (balanceWei <= 0n) return;
    const raw = (balanceWei * BigInt(pct)) / 100n;
    const whole = Number(raw / 10n ** 18n);
    setAmountInput(whole > 0 ? String(whole) : (Number(raw) / 1e18).toFixed(4));
  }

  return (
    <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[var(--signal-emerald)]" />
          <span className="font-display font-semibold text-sm text-white">
            Creator Vesting Vault
          </span>
        </div>
        {hasCreatorLock ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-emerald-500/12 text-emerald-400 border border-emerald-500/25">
            <ShieldCheck className="w-3 h-3" /> Creator Locked
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            No Lock Yet
          </span>
        )}
      </div>

      <div className="flex items-center justify-between font-mono tabular-nums pt-2 border-t border-[var(--border-subtle)]">
        <span className="text-[var(--text-muted)]">Total Locked</span>
        <span className="text-white font-medium">
          {formatTokenAmount(totalRemainingLocked)} ${symbol}{" "}
          <span className="text-[var(--text-muted)]">({lockedPct.toFixed(2)}%)</span>
        </span>
      </div>

      {parsedLocks.length > 0 && (
        <div className="space-y-2 pt-1">
          {parsedLocks.map((lock) => {
            const unlockDate = new Date((lock.startTime + lock.duration) * 1000).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );
            const isBeneficiary =
              connectedAddress?.toLowerCase() === lock.beneficiary.toLowerCase();
            return (
              <div
                key={lock.id.toString()}
                className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    {formatTokenAmount(lock.remaining)} ${symbol}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Unlocks {unlockDate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>
                    {shortenAddress(lock.beneficiary, 4)}
                    {lock.beneficiary.toLowerCase() === creatorAddress.toLowerCase() && (
                      <span className="ml-1.5 text-emerald-400">BUILDER</span>
                    )}
                  </span>
                  <span>
                    {Math.round(lock.cliffDuration / 86_400)}d cliff ·{" "}
                    {Math.round(lock.duration / 86_400)}d linear
                  </span>
                </div>
                {isBeneficiary && lock.claimable > 0n && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleClaim(lock.id)}
                    className="w-full mt-1 py-1.5 rounded-md bg-white text-[#09090B] font-semibold text-[11px] hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
                  >
                    Claim {formatTokenAmount(lock.claimable)} ${symbol}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {statusMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-[11px] text-rose-400 font-mono break-words">{errorMsg}</div>
      )}

      {isCreator && (
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          {!showLockForm ? (
            <button
              type="button"
              onClick={() => setShowLockForm(true)}
              className="w-full py-2 rounded-lg bg-white text-[#09090B] font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Lock Builder Tokens (Anti-Rug)
            </button>
          ) : (
            <form onSubmit={handleLockSubmit} className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[var(--text-muted)]">Wallet balance</span>
                <span className="text-white">
                  {formatTokenAmount(balanceWei)} ${symbol}
                </span>
              </div>

              <div className="space-y-1.5">
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder={`Amount in $${symbol}`}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-white outline-none focus:border-white/40"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  {[25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setPercentAmount(pct)}
                      className="py-1 rounded bg-[var(--bg-elevated)] hover:bg-white/10 text-[11px] font-mono text-[var(--text-secondary)] cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[var(--text-muted)]">Vesting schedule</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {VESTING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPresetId(preset.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-left font-mono text-[11px] border cursor-pointer transition-colors ${
                        presetId === preset.id
                          ? "bg-white/10 border-white/40 text-white"
                          : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLockForm(false)}
                  disabled={busy}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || parsedAmountWei <= 0n}
                  className="flex-1 py-2 rounded-lg bg-white text-[#09090B] font-semibold text-xs hover:bg-zinc-200 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {needsApproval ? `Approve & Lock` : `Lock Tokens`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {vaultExplorerUrl && (
        <div className="pt-1 flex justify-end">
          <a
            href={vaultExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Vault Contract <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
