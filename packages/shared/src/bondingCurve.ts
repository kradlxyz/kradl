/**
 * Off-chain BigInt Bonding Curve math — mirrors KradlLaunchpad.sol 100%.
 * All values are in wei (18 decimals). NEVER use JS floating point for wei math.
 */

export const BPS_DENOMINATOR = 10_000n;
export const PLATFORM_FEE_BPS = 50n; // 0.5%
export const CREATOR_FEE_BPS = 50n; // 0.5%
export const TOTAL_TRADE_FEE_BPS = PLATFORM_FEE_BPS + CREATOR_FEE_BPS; // 1.0%
export const GRADUATION_FEE_BPS = 200n; // 2.0%

export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
export const CURVE_SUPPLY = 800_000_000n * 10n ** 18n;
export const DEX_RESERVE_SUPPLY = 200_000_000n * 10n ** 18n;

export interface CurveSnapshot {
  virtualEthReserve: bigint;
  virtualTokenReserve: bigint;
  realEthReserve: bigint;
  realTokenReserve: bigint;
  graduationThreshold: bigint;
}

export interface BuyQuote {
  grossEthUsed: bigint;
  ethRefund: bigint;
  platformFee: bigint;
  creatorFee: bigint;
  netEthIn: bigint;
  tokensOut: bigint;
  willGraduate: boolean;
}

export interface SellQuote {
  tokensIn: bigint;
  grossEthOut: bigint;
  platformFee: bigint;
  creatorFee: bigint;
  netEthOut: bigint;
}

/**
 * Mirrors KradlLaunchpad.quoteBuy(token, msgValue)
 */
export function quoteBuy(curve: CurveSnapshot, grossEthIn: bigint): BuyQuote {
  if (grossEthIn <= 0n) {
    return {
      grossEthUsed: 0n,
      ethRefund: 0n,
      platformFee: 0n,
      creatorFee: 0n,
      netEthIn: 0n,
      tokensOut: 0n,
      willGraduate: false,
    };
  }

  const remainingEthToGraduate =
    curve.graduationThreshold > curve.realEthReserve
      ? curve.graduationThreshold - curve.realEthReserve
      : 0n;

  if (remainingEthToGraduate === 0n || curve.realTokenReserve === 0n) {
    return {
      grossEthUsed: 0n,
      ethRefund: grossEthIn,
      platformFee: 0n,
      creatorFee: 0n,
      netEthIn: 0n,
      tokensOut: 0n,
      willGraduate: true,
    };
  }

  let platformFee = (grossEthIn * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
  let creatorFee = (grossEthIn * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
  let netEthIn = grossEthIn - platformFee - creatorFee;
  let grossEthUsed = grossEthIn;
  let ethRefund = 0n;

  if (netEthIn > remainingEthToGraduate) {
    netEthIn = remainingEthToGraduate;
    // Gross ETH needed so that net = gross * (10000 - 100) / 10000 >= remainingEthToGraduate
    grossEthUsed =
      (netEthIn * BPS_DENOMINATOR + (BPS_DENOMINATOR - TOTAL_TRADE_FEE_BPS - 1n)) /
      (BPS_DENOMINATOR - TOTAL_TRADE_FEE_BPS);
    if (grossEthUsed > grossEthIn) {
      grossEthUsed = grossEthIn;
    }
    platformFee = (grossEthUsed * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
    creatorFee = (grossEthUsed * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
    netEthIn = grossEthUsed - platformFee - creatorFee;
    if (netEthIn > remainingEthToGraduate) {
      netEthIn = remainingEthToGraduate;
    }
    ethRefund = grossEthIn - grossEthUsed;
  }

  let tokensOut =
    (netEthIn * curve.virtualTokenReserve) / (curve.virtualEthReserve + netEthIn);
  if (tokensOut > curve.realTokenReserve) {
    tokensOut = curve.realTokenReserve;
  }

  const willGraduate =
    curve.realEthReserve + netEthIn >= curve.graduationThreshold ||
    tokensOut >= curve.realTokenReserve;

  return {
    grossEthUsed,
    ethRefund,
    platformFee,
    creatorFee,
    netEthIn,
    tokensOut,
    willGraduate,
  };
}

/**
 * Mirrors KradlLaunchpad.quoteSell(token, tokensIn)
 */
export function quoteSell(curve: CurveSnapshot, tokensIn: bigint): SellQuote {
  if (tokensIn <= 0n || curve.realEthReserve === 0n) {
    return {
      tokensIn: 0n,
      grossEthOut: 0n,
      platformFee: 0n,
      creatorFee: 0n,
      netEthOut: 0n,
    };
  }

  let grossEthOut =
    (tokensIn * curve.virtualEthReserve) / (curve.virtualTokenReserve + tokensIn);
  if (grossEthOut > curve.realEthReserve) {
    grossEthOut = curve.realEthReserve;
  }

  const platformFee = (grossEthOut * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
  const creatorFee = (grossEthOut * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
  const netEthOut = grossEthOut - platformFee - creatorFee;

  return {
    tokensIn,
    grossEthOut,
    platformFee,
    creatorFee,
    netEthOut,
  };
}

/**
 * Spot price in wei per 1 full token (scaled by 1e18).
 */
export function getSpotPriceWei(curve: CurveSnapshot): bigint {
  if (curve.virtualTokenReserve === 0n) return 0n;
  return (curve.virtualEthReserve * 10n ** 18n) / curve.virtualTokenReserve;
}

/**
 * Bonding curve progress in basis points (0 .. 10000 = 0% .. 100%).
 */
export function getCurveProgressBps(curve: CurveSnapshot): number {
  if (curve.graduationThreshold === 0n) return 10_000;
  const bps = (curve.realEthReserve * 10_000n) / curve.graduationThreshold;
  return Number(bps > 10_000n ? 10_000n : bps);
}
