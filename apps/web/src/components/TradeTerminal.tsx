"use client";

import React, { useMemo, useState } from "react";
import { parseEther, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Settings2, ExternalLink, CheckCircle2, AlertCircle, HeartHandshake } from "lucide-react";
import {
  KRADL_LAUNCHPAD_ABI,
  KRADL_TOKEN_ABI,
  getChainConfig,
  getLaunchpadAddress,
  getTxExplorerUrl,
  quoteBuy,
  quoteSell,
  CurveSnapshot,
} from "@kradl/shared";
import { formatEthValue, formatTokenAmount, parseRevertError } from "@/lib/format";

interface TradeTerminalProps {
  chainId: number;
  tokenAddress: `0x${string}`;
  symbol: string;
  graduated: boolean;
  curve: CurveSnapshot;
  onTradeSuccess?: () => void;
}

const BUY_PRESETS = ["0.01", "0.05", "0.1", "0.5"];
const SELL_PRESETS = [25, 50, 75, 100];

export function TradeTerminal({
  chainId,
  tokenAddress,
  symbol,
  graduated,
  curve,
  onTradeSuccess,
}: TradeTerminalProps) {
  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId });

  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amountInput, setAmountInput] = useState("");
  const [slippageBps, setSlippageBps] = useState(100); // 1.0%
  const [showSlippage, setShowSlippage] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending" | "success" | "error">(
    "idle"
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const launchpadAddress = getLaunchpadAddress(chainId);
  const chainConfig = getChainConfig(chainId);

  const { data: ethBalance } = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address) },
  });

  const { data: tokenBalanceRaw, refetch: refetchTokenBal } = useReadContract({
    address: tokenAddress,
    abi: KRADL_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address) },
  });

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: KRADL_TOKEN_ABI,
    functionName: "allowance",
    args: address && launchpadAddress ? [address, launchpadAddress] : undefined,
    chainId,
    query: { enabled: Boolean(address && launchpadAddress) },
  });

  const tokenBalance = (tokenBalanceRaw as bigint | undefined) ?? 0n;
  const allowance = (allowanceRaw as bigint | undefined) ?? 0n;

  // Instant client-side BigInt quotes (mirrors Solidity 100%)
  const parsedInputWei = useMemo(() => {
    try {
      if (!amountInput || Number(amountInput) <= 0) return 0n;
      return mode === "buy" ? parseEther(amountInput) : parseUnits(amountInput, 18);
    } catch {
      return 0n;
    }
  }, [amountInput, mode]);

  const buyQuote = useMemo(
    () => (mode === "buy" ? quoteBuy(curve, parsedInputWei) : null),
    [mode, curve, parsedInputWei]
  );

  const sellQuote = useMemo(
    () => (mode === "sell" ? quoteSell(curve, parsedInputWei) : null),
    [mode, curve, parsedInputWei]
  );

  const wrongChain = isConnected && activeChainId !== chainId;

  async function handleSubmit() {
    setErrorMsg(null);
    setTxHash(null);

    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (wrongChain) {
      await switchChainAsync({ chainId });
      return;
    }
    if (!launchpadAddress) {
      setErrorMsg("Launchpad contract address is not configured for this network yet.");
      setTxStatus("error");
      return;
    }
    if (parsedInputWei <= 0n) return;

    try {
      setTxStatus("signing");

      if (mode === "buy" && buyQuote) {
        const minTokensOut = (buyQuote.tokensOut * BigInt(10_000 - slippageBps)) / 10_000n;
        const hash = await writeContractAsync({
          address: launchpadAddress,
          abi: KRADL_LAUNCHPAD_ABI,
          functionName: "buy",
          args: [tokenAddress, minTokensOut],
          value: parsedInputWei,
          chainId,
        });
        setTxHash(hash);
        setTxStatus("pending");
        await publicClient?.waitForTransactionReceipt({ hash });
      } else if (mode === "sell" && sellQuote) {
        if (allowance < parsedInputWei) {
          const approveHash = await writeContractAsync({
            address: tokenAddress,
            abi: KRADL_TOKEN_ABI,
            functionName: "approve",
            args: [launchpadAddress, parsedInputWei],
            chainId,
          });
          setTxStatus("pending");
          await publicClient?.waitForTransactionReceipt({ hash: approveHash });
          await refetchAllowance();
          setTxStatus("signing");
        }

        const minEthOut = (sellQuote.netEthOut * BigInt(10_000 - slippageBps)) / 10_000n;
        const hash = await writeContractAsync({
          address: launchpadAddress,
          abi: KRADL_LAUNCHPAD_ABI,
          functionName: "sell",
          args: [tokenAddress, parsedInputWei, minEthOut],
          chainId,
        });
        setTxHash(hash);
        setTxStatus("pending");
        await publicClient?.waitForTransactionReceipt({ hash });
      }

      setTxStatus("success");
      setAmountInput("");
      await refetchTokenBal();
      onTradeSuccess?.();
    } catch (err) {
      setTxStatus("error");
      setErrorMsg(parseRevertError(err));
    }
  }

  const explorerTxUrl = txHash ? getTxExplorerUrl(chainId, txHash) : null;

  return (
    <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5">
      {/* Buy / Sell Segmented Toggle */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="grid grid-cols-2 flex-1 p-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <button
            onClick={() => {
              setMode("buy");
              setAmountInput("");
              setTxStatus("idle");
            }}
            className={`py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
              mode === "buy"
                ? "bg-[var(--trade-buy)] text-[var(--accent-ink)]"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => {
              setMode("sell");
              setAmountInput("");
              setTxStatus("idle");
            }}
            className={`py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
              mode === "sell"
                ? "bg-[var(--trade-sell)] text-white"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        <button
          onClick={() => setShowSlippage((v) => !v)}
          className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white cursor-pointer"
          title="Slippage settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {showSlippage && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--text-secondary)]">Slippage Tolerance</span>
          <div className="flex items-center gap-1">
            {[50, 100, 300].map((bps) => (
              <button
                key={bps}
                onClick={() => setSlippageBps(bps)}
                className={`px-2 py-1 rounded cursor-pointer ${
                  slippageBps === bps
                    ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus-within:border-[var(--border-strong)] p-3.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-mono">
          <span>{mode === "buy" ? "You Pay (ETH)" : `You Sell ($${symbol})`}</span>
          <span>
            Bal:{" "}
            {mode === "buy"
              ? `${formatEthValue(ethBalance?.value ?? 0n)} ETH`
              : `${formatTokenAmount(tokenBalance)} $${symbol}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            disabled={graduated}
            className="w-full bg-transparent text-2xl font-mono tabular-nums font-semibold text-white outline-none placeholder:text-[var(--text-muted)]"
          />
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs font-semibold text-[var(--text-primary)]">
            {mode === "buy" ? "ETH" : `$${symbol}`}
          </span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {mode === "buy"
            ? BUY_PRESETS.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmountInput(val)}
                  className="py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-xs font-mono text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  {val} ETH
                </button>
              ))
            : SELL_PRESETS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    const amt = (tokenBalance * BigInt(pct)) / 100n;
                    setAmountInput((Number(amt) / 1e18).toString());
                  }}
                  className="py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-xs font-mono text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  {pct === 100 ? "MAX" : `${pct}%`}
                </button>
              ))}
        </div>
      </div>

      {/* Transparent Quote & Builder Funding Breakdown */}
      {parsedInputWei > 0n && (
        <div className="mt-3 p-3 rounded-xl bg-[#090d14] border border-[var(--border-subtle)] space-y-1.5 text-xs font-mono tabular-nums">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">You receive</span>
            <span className="text-white font-semibold">
              {mode === "buy" && buyQuote
                ? `~${formatTokenAmount(buyQuote.tokensOut)} $${symbol}`
                : sellQuote
                  ? `~${formatEthValue(sellQuote.netEthOut)} ETH`
                  : "0"}
            </span>
          </div>
          <div className="flex justify-between text-[var(--accent-primary)]">
            <span className="inline-flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5" /> Builder Funding (0.5%)
            </span>
            <span>
              {formatEthValue(
                mode === "buy" ? (buyQuote?.creatorFee ?? 0n) : (sellQuote?.creatorFee ?? 0n),
                5
              )}{" "}
              ETH
            </span>
          </div>
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Platform Fee (0.5%)</span>
            <span>
              {formatEthValue(
                mode === "buy" ? (buyQuote?.platformFee ?? 0n) : (sellQuote?.platformFee ?? 0n),
                5
              )}{" "}
              ETH
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={
          graduated ||
          txStatus === "signing" ||
          txStatus === "pending" ||
          (isConnected && !wrongChain && parsedInputWei <= 0n)
        }
        className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === "buy"
            ? "bg-[var(--trade-buy)] text-[#07090E] hover:brightness-110"
            : "bg-[var(--trade-sell)] text-white hover:brightness-110"
        }`}
      >
        {graduated
          ? "Graduated — Trade on DEX"
          : !isConnected
            ? "Connect Wallet"
            : wrongChain
              ? `Switch to ${chainConfig?.shortName ?? "Network"}`
              : txStatus === "signing"
                ? "Confirm in Wallet..."
                : txStatus === "pending"
                  ? "Confirming On-Chain..."
                  : mode === "buy"
                    ? `Buy $${symbol}`
                    : `Sell $${symbol}`}
      </button>

      {/* Tx Feedback */}
      {txStatus === "success" && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Trade confirmed!
          </span>
          {explorerTxUrl && (
            <a
              href={explorerTxUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline font-mono"
            >
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {txStatus === "error" && errorMsg && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
