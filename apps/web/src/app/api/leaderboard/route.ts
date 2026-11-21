import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const chainIdParam = new URL(req.url).searchParams.get("chainId");
    const where =
      chainIdParam && chainIdParam !== "all" && !Number.isNaN(Number(chainIdParam))
        ? { chainId: Number(chainIdParam) }
        : {};

    const [topProjects, builderStats] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [{ marketCapEth: "desc" }, { totalVolumeEth: "desc" }],
        take: 25,
        include: {
          creator: { select: { walletAddress: true, displayName: true, avatarUrl: true } },
        },
      }),
      prisma.project.groupBy({
        by: ["creatorAddress"],
        where,
        _count: { id: true },
        _sum: {
          totalCreatorFeeEth: true,
          totalVolumeEth: true,
          marketCapEth: true,
        },
        orderBy: { _sum: { totalCreatorFeeEth: "desc" } },
        take: 25,
      }),
    ]);

    const builderAddresses = builderStats.map((b) => b.creatorAddress);
    const users = await prisma.user.findMany({
      where: { walletAddress: { in: builderAddresses } },
    });
    const userMap = new Map(users.map((u) => [u.walletAddress, u]));

    const topBuilders = builderStats.map((b) => ({
      walletAddress: b.creatorAddress,
      user: userMap.get(b.creatorAddress) ?? null,
      projectCount: b._count.id,
      totalCreatorFeeEth: b._sum.totalCreatorFeeEth ?? 0,
      totalVolumeEth: b._sum.totalVolumeEth ?? 0,
      totalMarketCapEth: b._sum.marketCapEth ?? 0,
    }));

    return NextResponse.json({ topProjects, topBuilders });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
