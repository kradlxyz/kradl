import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chainIdParam = searchParams.get("chainId");
    const category = searchParams.get("category");
    const status = searchParams.get("status"); // live | graduating | graduated | verified
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort") || "trending"; // trending | newest | mcap | volume
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 24)));

    const where: Prisma.ProjectWhereInput = {};

    if (chainIdParam && chainIdParam !== "all") {
      const parsedChainId = Number(chainIdParam);
      if (!Number.isNaN(parsedChainId)) {
        where.chainId = parsedChainId;
      }
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (status === "live") {
      where.graduated = false;
    } else if (status === "graduated") {
      where.graduated = true;
    } else if (status === "verified") {
      where.isVerified = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { symbol: { contains: search, mode: "insensitive" } },
        { tagline: { contains: search, mode: "insensitive" } },
        { tokenAddress: { contains: search.toLowerCase(), mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.ProjectOrderByWithRelationInput[] = [
      { volume24hEth: "desc" },
      { launchedAt: "desc" },
    ];
    if (sort === "newest") {
      orderBy = [{ launchedAt: "desc" }];
    } else if (sort === "mcap") {
      orderBy = [{ marketCapEth: "desc" }];
    } else if (sort === "volume") {
      orderBy = [{ totalVolumeEth: "desc" }];
    }

    const [projects, total, agg, recentTrades] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { walletAddress: true, displayName: true, avatarUrl: true, twitterHandle: true },
          },
          candles: {
            where: { interval: "5m" },
            orderBy: { bucketTime: "desc" },
            take: 24,
            select: { close: true },
          },
        },
      }),
      prisma.project.count({ where }),
      prisma.project.aggregate({
        _count: { id: true },
        _sum: { totalVolumeEth: true, totalCreatorFeeEth: true },
      }),
      prisma.trade.findMany({
        orderBy: { timestamp: "desc" },
        take: 15,
        include: {
          project: {
            select: { name: true, symbol: true, chainId: true, tokenAddress: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      projects: projects.map(({ candles, ...rest }) => ({
        ...rest,
        sparkline: candles.map((c) => c.close).reverse(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalProjects: agg._count.id,
        totalVolumeEth: agg._sum.totalVolumeEth ?? 0,
        totalCreatorFeesEth: agg._sum.totalCreatorFeeEth ?? 0,
      },
      ticker: recentTrades.map((t) => ({
        id: t.id,
        chainId: t.chainId,
        tokenAddress: t.tokenAddress,
        symbol: t.project.symbol,
        projectName: t.project.name,
        traderAddress: t.traderAddress,
        isBuy: t.isBuy,
        ethAmount: t.ethAmount,
        timestamp: t.timestamp,
      })),
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
