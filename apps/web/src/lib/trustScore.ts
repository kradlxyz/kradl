import { TOTAL_SUPPLY } from "@kradl/shared";

export interface HolderInput {
  walletAddress: string;
  balance: string; // raw wei string
}

export interface ProjectTrustInput {
  creatorAddress: string;
  isVerified: boolean;
  liveUrl?: string | null;
  githubUrl?: string | null;
  graduated: boolean;
  launchedAt: Date | string;
  updateCount: number;
  holders: HolderInput[];
}

export interface ProjectTrustReport {
  builderHoldingPct: number;
  top10ConcentrationPct: number;
  isConcentrated: boolean;
  isNewLaunch: boolean;
  riskLevel: "low" | "moderate" | "elevated";
  checks: {
    fixedSupply: boolean;
    noMintOrBlacklist: boolean;
    autoDexGraduation: boolean;
    liveAppVerified: boolean;
    githubVerified: boolean;
    hasChangelog: boolean;
  };
}

function weiToSupplyPct(wei: bigint): number {
  if (wei <= 0n || TOTAL_SUPPLY <= 0n) return 0;
  // Basis points with 2 decimal precision (e.g. 1234 -> 12.34%)
  const bps = (wei * 10_000n) / TOTAL_SUPPLY;
  return Number(bps) / 100;
}

export function computeProjectTrustReport(input: ProjectTrustInput): ProjectTrustReport {
  const creatorLower = input.creatorAddress.toLowerCase();

  const positiveHolders = input.holders
    .map((h) => ({
      walletAddress: h.walletAddress.toLowerCase(),
      balance: BigInt(h.balance || "0"),
    }))
    .filter((h) => h.balance > 0n)
    .sort((a, b) => (b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : 0));

  const creatorRow = positiveHolders.find((h) => h.walletAddress === creatorLower);
  const builderHoldingPct = weiToSupplyPct(creatorRow?.balance ?? 0n);

  const top10Sum = positiveHolders
    .slice(0, 10)
    .reduce((acc, h) => acc + h.balance, 0n);
  const top10ConcentrationPct = weiToSupplyPct(top10Sum);
  const isConcentrated = top10ConcentrationPct > 40;

  const launchedMs =
    typeof input.launchedAt === "string"
      ? new Date(input.launchedAt).getTime()
      : input.launchedAt.getTime();
  const isNewLaunch = Date.now() - launchedMs < 24 * 60 * 60 * 1000;

  const liveAppVerified = Boolean(input.liveUrl);
  const githubVerified = Boolean(input.githubUrl);
  const hasChangelog = input.updateCount > 0;

  let riskLevel: "low" | "moderate" | "elevated" = "moderate";
  if (input.isVerified && !isConcentrated) {
    riskLevel = "low";
  } else if (isConcentrated || (!liveAppVerified && !githubVerified)) {
    riskLevel = "elevated";
  }

  return {
    builderHoldingPct,
    top10ConcentrationPct,
    isConcentrated,
    isNewLaunch,
    riskLevel,
    checks: {
      fixedSupply: true,
      noMintOrBlacklist: true,
      autoDexGraduation: true,
      liveAppVerified,
      githubVerified,
      hasChangelog,
    },
  };
}
