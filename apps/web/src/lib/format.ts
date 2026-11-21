import { formatEther, formatUnits } from "viem";

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEthValue(wei: bigint | string | number, decimals = 4): string {
  try {
    const num =
      typeof wei === "number"
        ? wei
        : Number(formatEther(typeof wei === "bigint" ? wei : BigInt(wei || "0")));
    if (!Number.isFinite(num) || num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  } catch {
    return "0";
  }
}

export function formatTokenAmount(wei: bigint | string, decimals = 18): string {
  try {
    const num = Number(formatUnits(typeof wei === "bigint" ? wei : BigInt(wei || "0"), decimals));
    return formatCompactNumber(num);
  } catch {
    return "0";
  }
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (abs < 0.0001) return value.toExponential(2);
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function timeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function parseRevertError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (msg.includes("User rejected") || msg.includes("User denied")) {
    return "Transaction cancelled in wallet.";
  }
  if (msg.includes("SlippageExceeded")) {
    return "Price moved beyond your slippage tolerance. Try increasing slippage.";
  }
  if (msg.includes("AlreadyGraduated")) {
    return "This project has already graduated to DEX.";
  }
  if (msg.includes("NothingToClaim")) {
    return "No builder fees available to claim yet.";
  }
  if (msg.includes("insufficient funds")) {
    return "Insufficient ETH balance for amount + gas fee.";
  }
  if (msg.includes("InsufficientLiquidity")) {
    return "Not enough ETH reserve in bonding curve for this sell size.";
  }
  return "Transaction failed. Please check your wallet and network.";
}
