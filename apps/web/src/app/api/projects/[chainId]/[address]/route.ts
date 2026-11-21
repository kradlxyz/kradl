import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeProjectTrustReport } from "@/lib/trustScore";

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

    return NextResponse.json({ project: projectFields, trustReport });
  } catch (error) {
    console.error("GET /api/projects/[chainId]/[address] error:", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}
