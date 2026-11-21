import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

async function main() {
  const updates = [
    {
      symbol: "NSQL",
      tagline: "Open-source AI SQL copilot and query optimizer for PostgreSQL teams.",
      description:
        "NovaSQL connects directly to your local or production PostgreSQL schema, explains slow query plans in plain language, and suggests safe index migrations. All 0.5% Kradl builder fees fund GPU inference credits for the free community tier.",
      category: "AI & Agents",
      liveUrl: "https://novasql.dev",
      githubUrl: "https://github.com/novasql/novasql",
      isVerified: true,
      verifiedSources: ["live_app", "github"],
    },
    {
      symbol: "PDIFF",
      tagline: "Visual API schema diffing and automated breaking-change alerts for CI.",
      description:
        "PulseDiff tracks OpenAPI and GraphQL schema changes on every pull request and posts readable diffs before breaking changes hit production.",
      category: "SaaS & Tools",
      liveUrl: "https://pulsediff.io",
      githubUrl: "https://github.com/pulsediff/cli",
      isVerified: true,
      verifiedSources: ["live_app", "github"],
    },
    {
      symbol: "VXFG",
      tagline: "Browser-native collaborative voxel engine with instant WebGL export.",
      description:
        "VoxelForge lets indie game studios sculpt, animate, and export lightweight voxel scenes directly in the browser without installing heavy desktop tools.",
      category: "Games",
      liveUrl: "https://voxelforge.app",
      githubUrl: "https://github.com/voxelforge/engine",
      isVerified: true,
      verifiedSources: ["live_app", "github"],
    },
  ];

  for (const u of updates) {
    await prisma.project.updateMany({
      where: { chainId: 31337, symbol: u.symbol },
      data: {
        tagline: u.tagline,
        description: u.description,
        category: u.category,
        liveUrl: u.liveUrl,
        githubUrl: u.githubUrl,
        isVerified: u.isVerified,
        verifiedSources: u.verifiedSources,
      },
    });
  }

  console.log("✅ Updated app showcase metadata for 3 indexed projects");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
