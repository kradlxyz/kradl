import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { prisma } from "@/lib/prisma";
import { TtlCache } from "@/lib/rateLimit";

const MAINNET_CHAIN_IDS = [4663, 8453];
const revenueCache = new TtlCache<Record<string, unknown>>(15_000);

export async function GET() {
  try {
    const cached = revenueCache.get();
    if (cached) {
      return NextResponse.json(cached);
    }

    const [projectAgg, verifiedCount, totalTrades, recentTrades] = await Promise.all([
      prisma.project.aggregate({
        where: { chainId: { in: MAINNET_CHAIN_IDS } },
        _count: { id: true },
        _sum: { totalVolumeEth: true, totalCreatorFeeEth: true },
      }),
      prisma.project.count({ where: { isVerified: true, chainId: { in: MAINNET_CHAIN_IDS } } }),
      prisma.trade.count({ where: { chainId: { in: MAINNET_CHAIN_IDS } } }),
      prisma.trade.findMany({
        where: { chainId: { in: MAINNET_CHAIN_IDS } },
        orderBy: { timestamp: "desc" },
        take: 40,
        include: {
          project: {
            select: { name: true, symbol: true, chainId: true, tokenAddress: true },
          },
        },
      }),
    ]);

    // Aggregate daily protocol fees over last 30 days
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trades30d = await prisma.trade.findMany({
      where: { chainId: { in: MAINNET_CHAIN_IDS }, timestamp: { gte: since30d } },
      select: { timestamp: true, ethAmount: true, platformFee: true, creatorFee: true },
      orderBy: { timestamp: "asc" },
    });

    const dailyMap = new Map<
      string,
      { date: string; volumeEth: number; platformFeeEth: number; builderFeeEth: number; trades: number }
    >();

    for (const t of trades30d) {
      const day = t.timestamp.toISOString().slice(0, 10);
      const entry = dailyMap.get(day) ?? {
        date: day,
        volumeEth: 0,
        platformFeeEth: 0,
        builderFeeEth: 0,
        trades: 0,
      };
      entry.volumeEth += Number(formatEther(BigInt(t.ethAmount || "0")));
      entry.platformFeeEth += Number(formatEther(BigInt(t.platformFee || "0")));
      entry.builderFeeEth += Number(formatEther(BigInt(t.creatorFee || "0")));
      entry.trades += 1;
      dailyMap.set(day, entry);
    }

    const totalBuilderFeesEth = projectAgg._sum.totalCreatorFeeEth ?? 0;

    const payload = {
      summary: {
        totalProjects: projectAgg._count.id,
        verifiedProjects: verifiedCount,
        totalTrades,
        totalVolumeEth: projectAgg._sum.totalVolumeEth ?? 0,
        totalBuilderFeesEth,
        // Platform earns matching 0.5% trade fee (plus 2% graduation fees)
        totalPlatformFeesEth: totalBuilderFeesEth,
      },
      daily: Array.from(dailyMap.values()).reverse(),
      recentFeeEvents: recentTrades.map((t) => ({
        id: t.id,
        chainId: t.chainId,
        tokenAddress: t.tokenAddress,
        projectName: t.project.name,
        symbol: t.project.symbol,
        txHash: t.txHash,
        isBuy: t.isBuy,
        ethAmount: t.ethAmount,
        platformFee: t.platformFee,
        creatorFee: t.creatorFee,
        timestamp: t.timestamp,
      })),
    };
    revenueCache.set(payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/revenue error:", error);
    return NextResponse.json({ error: "Failed to load protocol revenue" }, { status: 500 });
  }
}
