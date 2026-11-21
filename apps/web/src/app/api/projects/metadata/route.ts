import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionAddress } from "@/lib/auth";
import {
  isSafeHttpUrl,
  isValidGithubRepoUrl,
  safeOptionalUrlSchema,
} from "@/lib/validation";
import { PROJECT_CATEGORIES } from "@kradl/shared";

const metadataSchema = z.object({
  chainId: z.number().int().positive(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().trim().min(1).max(60),
  symbol: z.string().trim().min(1).max(16),
  tagline: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(PROJECT_CATEGORIES).default("AI & Agents"),
  logoUrl: safeOptionalUrlSchema,
  bannerUrl: safeOptionalUrlSchema,
  screenshots: z
    .array(z.string().refine(isSafeHttpUrl, "Screenshot URL must use http:// or https://"))
    .max(5)
    .optional(),
  liveUrl: safeOptionalUrlSchema,
  githubUrl: safeOptionalUrlSchema,
  twitterUrl: safeOptionalUrlSchema,
  discordUrl: safeOptionalUrlSchema,
});

export async function POST(req: NextRequest) {
  try {
    const sessionAddress = await getSessionAddress();
    if (!sessionAddress) {
      return NextResponse.json({ error: "Sign in with Ethereum required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = metadataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project metadata", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tokenAddress = data.tokenAddress.toLowerCase();

    const existing = await prisma.project.findUnique({
      where: { chainId_tokenAddress: { chainId: data.chainId, tokenAddress } },
    });

    if (existing && existing.creatorAddress !== sessionAddress) {
      return NextResponse.json(
        { error: "Only the project creator can edit metadata" },
        { status: 403 }
      );
    }

    // Automatic builder proof verification flags (strict hostname check prevents spoofing)
    const verifiedSources: string[] = [];
    if (data.liveUrl && isSafeHttpUrl(data.liveUrl)) verifiedSources.push("live_app");
    if (data.githubUrl && isValidGithubRepoUrl(data.githubUrl)) verifiedSources.push("github");
    if (data.twitterUrl && isSafeHttpUrl(data.twitterUrl)) verifiedSources.push("twitter");
    const isVerified = verifiedSources.includes("live_app") && verifiedSources.includes("github");

    await prisma.user.upsert({
      where: { walletAddress: sessionAddress },
      update: {},
      create: { walletAddress: sessionAddress },
    });

    const project = await prisma.project.upsert({
      where: { chainId_tokenAddress: { chainId: data.chainId, tokenAddress } },
      update: {
        tagline: data.tagline,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        screenshots: data.screenshots ?? [],
        liveUrl: data.liveUrl || null,
        githubUrl: data.githubUrl || null,
        twitterUrl: data.twitterUrl || null,
        discordUrl: data.discordUrl || null,
        isVerified,
        verifiedSources,
      },
      create: {
        chainId: data.chainId,
        tokenAddress,
        creatorAddress: sessionAddress,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        tagline: data.tagline,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        screenshots: data.screenshots ?? [],
        liveUrl: data.liveUrl || null,
        githubUrl: data.githubUrl || null,
        twitterUrl: data.twitterUrl || null,
        discordUrl: data.discordUrl || null,
        isVerified,
        verifiedSources,
      },
    });

    return NextResponse.json({ project }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("POST /api/projects/metadata error:", error);
    return NextResponse.json({ error: "Failed to save project metadata" }, { status: 500 });
  }
}
