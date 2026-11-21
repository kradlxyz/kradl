import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionAddress } from "@/lib/auth";

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(1500),
  parentId: z.string().optional(),
});

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
      where: { chainId_tokenAddress: { chainId, tokenAddress: address.toLowerCase() } },
      select: { id: true, creatorAddress: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [comments, holders] = await Promise.all([
      prisma.comment.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          author: { select: { walletAddress: true, displayName: true, avatarUrl: true } },
        },
      }),
      prisma.holderBalance.findMany({
        where: { projectId: project.id },
        select: { walletAddress: true, balance: true },
      }),
    ]);

    const holderSet = new Set(
      holders.filter((h) => BigInt(h.balance) > 0n).map((h) => h.walletAddress)
    );

    return NextResponse.json({
      comments: comments.map((c) => ({
        ...c,
        isCreator: c.authorAddress === project.creatorAddress,
        isHolder: holderSet.has(c.authorAddress),
      })),
    });
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const sessionAddress = await getSessionAddress();
    if (!sessionAddress) {
      return NextResponse.json({ error: "Sign in with Ethereum required" }, { status: 401 });
    }

    const { chainId: chainIdStr, address } = await context.params;
    const chainId = Number(chainIdStr);
    if (Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { chainId_tokenAddress: { chainId, tokenAddress: address.toLowerCase() } },
      select: { id: true, creatorAddress: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        projectId: project.id,
        authorAddress: sessionAddress,
        content: parsed.data.content,
        parentId: parsed.data.parentId || null,
      },
      include: {
        author: { select: { walletAddress: true, displayName: true, avatarUrl: true } },
      },
    });

    const holder = await prisma.holderBalance.findUnique({
      where: {
        projectId_walletAddress: { projectId: project.id, walletAddress: sessionAddress },
      },
    });

    return NextResponse.json(
      {
        comment: {
          ...comment,
          isCreator: sessionAddress === project.creatorAddress,
          isHolder: holder ? BigInt(holder.balance) > 0n : false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST comments error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
