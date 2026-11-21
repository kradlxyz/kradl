export const POINTS_CONFIG = {
  VERIFIED_LAUNCH_PTS: 1000,
  UNVERIFIED_LAUNCH_PTS: 500,
  UPDATE_PTS: 50,
  MAX_UPDATES_PER_PROJECT: 10,
  TRADE_VOLUME_PTS_PER_001_ETH: 100,
  EARLY_SUPPORTER_PTS: 150,
  ACTIVE_REFERRAL_BONUS_PTS: 250,
  REFERRAL_TRADING_SHARE_PCT: 15,
} as const;

export type RewardTier = "Genesis" | "Builder" | "Supporter" | "Explorer";

export interface WalletActivityInput {
  walletAddress: string;
  verifiedLaunches: number;
  unverifiedLaunches: number;
  /** Number of updates per project (each project capped at MAX_UPDATES_PER_PROJECT) */
  updatesPerProject: number[];
  /** Total on-chain traded ETH volume in wei */
  totalVolumeWei: bigint;
  /** Number of unique projects traded */
  uniqueProjectsTraded: number;
  /** Total trades executed */
  tradeCount: number;
}

export interface ReferralEdge {
  referrerAddress: string;
  refereeAddress: string;
}

export interface WalletRewardSummary {
  walletAddress: string;
  tier: RewardTier;
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

const ETH_ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export function isValidEthAddress(addr: string | null | undefined): addr is string {
  return typeof addr === "string" && ETH_ADDR_RE.test(addr.trim());
}

export function getRewardTier(totalPoints: number): RewardTier {
  if (totalPoints >= 5000) return "Genesis";
  if (totalPoints >= 1500) return "Builder";
  if (totalPoints >= 300) return "Supporter";
  return "Explorer";
}

/**
 * Validates whether a referral binding (referrer -> referee) is safe and allowed.
 * Prevents self-referrals, duplicate bindings, and A -> B -> A circular loops.
 */
export function validateReferralBinding(params: {
  referrerAddress: string;
  refereeAddress: string;
  existingReferrerForReferee: string | null;
  referrerOfReferrer: string | null;
}): { ok: true; referrer: string; referee: string } | { ok: false; error: string } {
  if (!isValidEthAddress(params.referrerAddress) || !isValidEthAddress(params.refereeAddress)) {
    return { ok: false, error: "Invalid wallet address format." };
  }

  const referrer = params.referrerAddress.trim().toLowerCase();
  const referee = params.refereeAddress.trim().toLowerCase();

  if (referrer === referee) {
    return { ok: false, error: "You cannot refer your own wallet." };
  }

  if (params.existingReferrerForReferee) {
    return { ok: false, error: "This wallet already has a bound referrer." };
  }

  if (params.referrerOfReferrer && params.referrerOfReferrer.toLowerCase() === referee) {
    return { ok: false, error: "Circular referral loops are not allowed." };
  }

  return { ok: true, referrer, referee };
}

/**
 * Computes deterministic Season 1 reward points for all wallets.
 * Anti-Sybil: referred wallets only award referral points once they have real on-chain activity
 * (at least 1 trade or 1 project launch).
 */
export function computeSeasonRewards(
  activities: WalletActivityInput[],
  referrals: ReferralEdge[]
): WalletRewardSummary[] {
  const baseByWallet = new Map<
    string,
    {
      launchPoints: number;
      updatePoints: number;
      tradingPoints: number;
      earlySupporterPoints: number;
      launchesCount: number;
      tradesCount: number;
      isActive: boolean;
    }
  >();

  for (const act of activities) {
    const wallet = act.walletAddress.toLowerCase();
    const launchPoints =
      act.verifiedLaunches * POINTS_CONFIG.VERIFIED_LAUNCH_PTS +
      act.unverifiedLaunches * POINTS_CONFIG.UNVERIFIED_LAUNCH_PTS;

    const cappedUpdates = act.updatesPerProject.reduce(
      (sum, count) => sum + Math.min(Math.max(0, count), POINTS_CONFIG.MAX_UPDATES_PER_PROJECT),
      0
    );
    const updatePoints = cappedUpdates * POINTS_CONFIG.UPDATE_PTS;

    // 100 pts per 0.01 ETH = 10_000_000_000_000_000 wei
    const tradingPoints =
      act.totalVolumeWei > 0n
        ? Number(
            (act.totalVolumeWei * BigInt(POINTS_CONFIG.TRADE_VOLUME_PTS_PER_001_ETH)) /
              10_000_000_000_000_000n
          )
        : 0;

    const earlySupporterPoints =
      Math.max(0, act.uniqueProjectsTraded) * POINTS_CONFIG.EARLY_SUPPORTER_PTS;
    const launchesCount = act.verifiedLaunches + act.unverifiedLaunches;
    const tradesCount = Math.max(0, act.tradeCount);

    baseByWallet.set(wallet, {
      launchPoints,
      updatePoints,
      tradingPoints,
      earlySupporterPoints,
      launchesCount,
      tradesCount,
      isActive: launchesCount > 0 || tradesCount > 0,
    });
  }

  // Group referrals by referrer
  const referralsByReferrer = new Map<string, string[]>();
  for (const edge of referrals) {
    const referrer = edge.referrerAddress.toLowerCase();
    const referee = edge.refereeAddress.toLowerCase();
    if (referrer === referee) continue;
    const list = referralsByReferrer.get(referrer) ?? [];
    list.push(referee);
    referralsByReferrer.set(referrer, list);

    // Ensure referrer appears in leaderboard even if they only referred active users
    if (!baseByWallet.has(referrer)) {
      baseByWallet.set(referrer, {
        launchPoints: 0,
        updatePoints: 0,
        tradingPoints: 0,
        earlySupporterPoints: 0,
        launchesCount: 0,
        tradesCount: 0,
        isActive: false,
      });
    }
  }

  const results: WalletRewardSummary[] = [];

  for (const [walletAddress, base] of baseByWallet.entries()) {
    const referees = referralsByReferrer.get(walletAddress) ?? [];
    let activeReferralsCount = 0;
    let pendingReferralsCount = 0;
    let referralPoints = 0;

    for (const refWallet of referees) {
      const refBase = baseByWallet.get(refWallet);
      if (refBase && refBase.isActive) {
        activeReferralsCount += 1;
        referralPoints += POINTS_CONFIG.ACTIVE_REFERRAL_BONUS_PTS;
        referralPoints += Math.floor(
          (refBase.tradingPoints * POINTS_CONFIG.REFERRAL_TRADING_SHARE_PCT) / 100
        );
      } else {
        pendingReferralsCount += 1;
      }
    }

    const totalPoints =
      base.launchPoints +
      base.updatePoints +
      base.tradingPoints +
      base.earlySupporterPoints +
      referralPoints;

    results.push({
      walletAddress,
      tier: getRewardTier(totalPoints),
      launchPoints: base.launchPoints,
      updatePoints: base.updatePoints,
      tradingPoints: base.tradingPoints,
      earlySupporterPoints: base.earlySupporterPoints,
      referralPoints,
      totalPoints,
      launchesCount: base.launchesCount,
      tradesCount: base.tradesCount,
      activeReferralsCount,
      pendingReferralsCount,
    });
  }

  results.sort((a, b) => b.totalPoints - a.totalPoints || b.launchesCount - a.launchesCount);
  return results;
}
