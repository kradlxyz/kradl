import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeProjectTrustReport } from "@/lib/trustScore";
import { computeActivityStats } from "@/lib/marketStats";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const { chainId: chainIdStr, address } = await context.params;
    const chainId = Number(chainIdStr);
    if (Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: {
        chainId_tokenAddress: {
          chainId,
          tokenAddress: address.toLowerCase(),
        },
      },
      include: {
        creator: {
          select: {
            walletAddress: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            twitterHandle: true,
            githubHandle: true,
          },
        },
        holders: {
          select: { walletAddress: true, balance: true },
        },
        _count: {
          select: { trades: true, comments: true, updates: true, holders: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { holders, ...projectFields } = project;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24hTrades = await prisma.trade.findMany({
      where: { projectId: project.id, timestamp: { gte: since24h } },
      select: { isBuy: true, ethAmount: true, priceEth: true, timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    const activityStats = computeActivityStats(recent24hTrades, project.priceEth);

    const trustReport = computeProjectTrustReport({
      creatorAddress: project.creatorAddress,
      isVerified: project.isVerified,
      liveUrl: project.liveUrl,
      githubUrl: project.githubUrl,
      graduated: project.graduated,
      launchedAt: project.launchedAt,
      updateCount: project._count.updates,
      holders,
    });

    return NextResponse.json({ project: projectFields, trustReport, activityStats });
  } catch (error) {
    console.error("GET /api/projects/[chainId]/[address] error:", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}
