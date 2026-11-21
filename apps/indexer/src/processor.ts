import { PrismaClient } from "@prisma/client";
import { formatEther } from "viem";
import { TOTAL_SUPPLY } from "@kradl/shared";

const CANDLE_INTERVALS: Array<{ name: string; seconds: number }> = [
  { name: "1m", seconds: 60 },
  { name: "5m", seconds: 300 },
  { name: "15m", seconds: 900 },
  { name: "1h", seconds: 3600 },
  { name: "1d", seconds: 86400 },
];

function computePriceEth(virtualEthReserve: bigint, virtualTokenReserve: bigint): number {
  if (virtualTokenReserve === 0n) return 0;
  // Price per 1 full token in ETH
  const priceWei = (virtualEthReserve * 10n ** 18n) / virtualTokenReserve;
  return Number(formatEther(priceWei));
}

function computeMarketCapEth(priceEth: number): number {
  return priceEth * Number(TOTAL_SUPPLY / 10n ** 18n);
}

export async function processProjectLaunched(
  prisma: PrismaClient,
  chainId: number,
  args: {
    token: string;
    creator: string;
    name: string;
    symbol: string;
    metadataUri: string;
    virtualEthReserve: bigint;
    virtualTokenReserve: bigint;
    graduationThreshold: bigint;
    timestamp: bigint;
  }
) {
  const tokenAddress = args.token.toLowerCase();
  const creatorAddress = args.creator.toLowerCase();
  const priceEth = computePriceEth(args.virtualEthReserve, args.virtualTokenReserve);
  const marketCapEth = computeMarketCapEth(priceEth);
  const launchedAt = new Date(Number(args.timestamp) * 1000);

  await prisma.user.upsert({
    where: { walletAddress: creatorAddress },
    update: {},
    create: { walletAddress: creatorAddress },
  });

  await prisma.project.upsert({
    where: { chainId_tokenAddress: { chainId, tokenAddress } },
    update: {
      name: args.name,
      symbol: args.symbol,
      metadataUri: args.metadataUri,
      virtualEthReserve: args.virtualEthReserve.toString(),
      virtualTokenReserve: args.virtualTokenReserve.toString(),
      graduationThreshold: args.graduationThreshold.toString(),
      priceEth,
      marketCapEth,
      launchedAt,
    },
    create: {
      chainId,
      tokenAddress,
      creatorAddress,
      name: args.name,
      symbol: args.symbol,
      metadataUri: args.metadataUri,
      virtualEthReserve: args.virtualEthReserve.toString(),
      virtualTokenReserve: args.virtualTokenReserve.toString(),
      graduationThreshold: args.graduationThreshold.toString(),
      priceEth,
      marketCapEth,
      launchedAt,
    },
  });
}

export async function processTrade(
  prisma: PrismaClient,
  chainId: number,
  txHash: string,
  logIndex: number,
  blockNumber: bigint,
  args: {
    token: string;
    trader: string;
    isBuy: boolean;
    ethAmount: bigint;
    tokenAmount: bigint;
    platformFee: bigint;
    creatorFee: bigint;
    virtualEthReserve: bigint;
    virtualTokenReserve: bigint;
    realEthReserve: bigint;
    timestamp: bigint;
  }
) {
  const tokenAddress = args.token.toLowerCase();
  const traderAddress = args.trader.toLowerCase();
  const timestamp = new Date(Number(args.timestamp) * 1000);

  const project = await prisma.project.findUnique({
    where: { chainId_tokenAddress: { chainId, tokenAddress } },
  });
  if (!project) return;

  // Idempotency check
  const existingTrade = await prisma.trade.findUnique({
    where: { chainId_txHash_logIndex: { chainId, txHash, logIndex } },
  });
  if (existingTrade) return;

  const priceEth = computePriceEth(args.virtualEthReserve, args.virtualTokenReserve);
  const marketCapEth = computeMarketCapEth(priceEth);
  const ethVolumeFloat = Number(formatEther(args.ethAmount));
  const creatorFeeFloat = Number(formatEther(args.creatorFee));

  await prisma.trade.create({
    data: {
      projectId: project.id,
      chainId,
      tokenAddress,
      txHash,
      logIndex,
      traderAddress,
      isBuy: args.isBuy,
      ethAmount: args.ethAmount.toString(),
      tokenAmount: args.tokenAmount.toString(),
      platformFee: args.platformFee.toString(),
      creatorFee: args.creatorFee.toString(),
      priceEth,
      blockNumber,
      timestamp,
    },
  });

  // Update HolderBalance
  const existingHolder = await prisma.holderBalance.findUnique({
    where: {
      projectId_walletAddress: { projectId: project.id, walletAddress: traderAddress },
    },
  });
  const prevBal = existingHolder ? BigInt(existingHolder.balance) : 0n;
  const nextBal = args.isBuy
    ? prevBal + args.tokenAmount
    : prevBal > args.tokenAmount
      ? prevBal - args.tokenAmount
      : 0n;

  await prisma.holderBalance.upsert({
    where: {
      projectId_walletAddress: { projectId: project.id, walletAddress: traderAddress },
    },
    update: { balance: nextBal.toString() },
    create: {
      projectId: project.id,
      chainId,
      tokenAddress,
      walletAddress: traderAddress,
      balance: nextBal.toString(),
    },
  });

  // Update OHLCV Candles for all intervals
  const unixSec = Number(args.timestamp);
  for (const { name, seconds } of CANDLE_INTERVALS) {
    const bucketSec = Math.floor(unixSec / seconds) * seconds;
    const bucketTime = new Date(bucketSec * 1000);

    const existingCandle = await prisma.candle.findUnique({
      where: {
        projectId_interval_bucketTime: { projectId: project.id, interval: name, bucketTime },
      },
    });

    if (existingCandle) {
      await prisma.candle.update({
        where: { id: existingCandle.id },
        data: {
          high: Math.max(existingCandle.high, priceEth),
          low: Math.min(existingCandle.low, priceEth),
          close: priceEth,
          volumeEth: existingCandle.volumeEth + ethVolumeFloat,
        },
      });
    } else {
      await prisma.candle.create({
        data: {
          projectId: project.id,
          chainId,
          tokenAddress,
          interval: name,
          bucketTime,
          open: priceEth,
          high: priceEth,
          low: priceEth,
          close: priceEth,
          volumeEth: ethVolumeFloat,
        },
      });
    }
  }

  // Recompute holderCount & 24h volume
  const holders = await prisma.holderBalance.findMany({
    where: { projectId: project.id },
    select: { balance: true },
  });
  const holderCount = holders.filter((h) => BigInt(h.balance) > 0n).length;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent24hTrades = await prisma.trade.findMany({
    where: { projectId: project.id, timestamp: { gte: since24h } },
    orderBy: { timestamp: "asc" },
    select: { ethAmount: true, priceEth: true },
  });
  const volume24hEth = recent24hTrades.reduce(
    (sum, t) => sum + Number(formatEther(BigInt(t.ethAmount))),
    0
  );
  const firstPrice24h = recent24hTrades[0]?.priceEth ?? priceEth;
  const priceChange24h =
    firstPrice24h > 0 ? ((priceEth - firstPrice24h) / firstPrice24h) * 100 : 0;

  await prisma.project.update({
    where: { id: project.id },
    data: {
      virtualEthReserve: args.virtualEthReserve.toString(),
      virtualTokenReserve: args.virtualTokenReserve.toString(),
      realEthReserve: args.realEthReserve.toString(),
      priceEth,
      priceChange24h,
      marketCapEth,
      volume24hEth,
      totalVolumeEth: { increment: ethVolumeFloat },
      totalCreatorFeeEth: { increment: creatorFeeFloat },
      holderCount,
      tradeCount: { increment: 1 },
    },
  });
}

export async function processProjectGraduated(
  prisma: PrismaClient,
  chainId: number,
  args: {
    token: string;
    liquidityPool: string;
  }
) {
  const tokenAddress = args.token.toLowerCase();
  await prisma.project.updateMany({
    where: { chainId, tokenAddress },
    data: {
      graduated: true,
      realEthReserve: "0",
      realTokenReserve: "0",
      liquidityPool: args.liquidityPool.toLowerCase(),
    },
  });
}
