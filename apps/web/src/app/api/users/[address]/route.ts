import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;
    const normalized = address.toLowerCase();

    const [user, launchedProjects, holdings] = await Promise.all([
      prisma.user.findUnique({ where: { walletAddress: normalized } }),
      prisma.project.findMany({
        where: { creatorAddress: normalized },
        orderBy: { launchedAt: "desc" },
      }),
      prisma.holderBalance.findMany({
        where: { walletAddress: normalized },
        include: {
          project: {
            select: {
              id: true,
              chainId: true,
              tokenAddress: true,
              name: true,
              symbol: true,
              logoUrl: true,
              priceEth: true,
              marketCapEth: true,
              graduated: true,
              isVerified: true,
            },
          },
        },
      }),
    ]);

    const activeHoldings = holdings.filter((h) => BigInt(h.balance) > 0n);
    const totalCreatorFeesEth = launchedProjects.reduce(
      (sum, p) => sum + p.totalCreatorFeeEth,
      0
    );

    return NextResponse.json({
      user: user ?? { walletAddress: normalized },
      launchedProjects,
      holdings: activeHoldings,
      summary: {
        launchedCount: launchedProjects.length,
        holdingCount: activeHoldings.length,
        totalCreatorFeesEth,
      },
    });
  } catch (error) {
    console.error("GET /api/users/[address] error:", error);
    return NextResponse.json({ error: "Failed to load user dashboard" }, { status: 500 });
  }
}
