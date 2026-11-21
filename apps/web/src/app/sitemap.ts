import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SITE_URL = "https://kradl.xyz";
const MAINNET_CHAIN_IDS = [4663, 8453];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/launch`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/litepaper`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/leaderboard`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/revenue`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/rewards`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/developers`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const projects = await prisma.project.findMany({
      where: { chainId: { in: MAINNET_CHAIN_IDS } },
      select: { chainId: true, tokenAddress: true, updatedAt: true },
      orderBy: { launchedAt: "desc" },
      take: 500,
    });

    const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
      url: `${SITE_URL}/project/${p.chainId}/${p.tokenAddress}`,
      lastModified: p.updatedAt,
      changeFrequency: "hourly",
      priority: 0.85,
    }));

    return [...staticRoutes, ...projectRoutes];
  } catch {
    return staticRoutes;
  }
}
