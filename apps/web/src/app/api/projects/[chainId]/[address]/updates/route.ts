import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionAddress } from "@/lib/auth";
import { getClientIp, globalRateLimiter } from "@/lib/rateLimit";

const createUpdateSchema = z.object({
  versionTag: z.string().trim().max(24).optional(),
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(10).max(5000),
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
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updates = await prisma.projectUpdate.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { walletAddress: true, displayName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("GET updates error:", error);
    return NextResponse.json({ error: "Failed to load updates" }, { status: 500 });
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

    const rate = globalRateLimiter.check(`update:${getClientIp(req)}:${sessionAddress}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many updates published. Please wait a minute." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
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
    if (project.creatorAddress !== sessionAddress) {
      return NextResponse.json(
        { error: "Only the project builder can publish updates" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    const update = await prisma.projectUpdate.create({
      data: {
        projectId: project.id,
        authorAddress: sessionAddress,
        versionTag: parsed.data.versionTag || null,
        title: parsed.data.title,
        content: parsed.data.content,
      },
      include: {
        author: { select: { walletAddress: true, displayName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ update }, { status: 201 });
  } catch (error) {
    console.error("POST updates error:", error);
    return NextResponse.json({ error: "Failed to publish update" }, { status: 500 });
  }
}
