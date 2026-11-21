import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeSeasonRewards,
  isValidEthAddress,
  POINTS_CONFIG,
  WalletActivityInput,
} from "@/lib/rewards";

export async function GET(req: NextRequest) {
  try {
    const rawAddress = req.nextUrl.searchParams.get("address");
    const targetWallet = isValidEthAddress(rawAddress) ? rawAddress.trim().toLowerCase() : null;

    const [projects, updates, trades, referrals] = await Promise.all([
      prisma.project.findMany({
        select: { id: true, creatorAddress: true, isVerified: true },
      }),
      prisma.projectUpdate.findMany({
        select: { projectId: true, authorAddress: true },
      }),
      prisma.trade.findMany({
        select: { projectId: true, traderAddress: true, ethAmount: true },
      }),
      prisma.referral.findMany({
        select: { referrerAddress: true, refereeAddress: true },
      }),
    ]);

    const walletMap = new Map<
      string,
      {
        verifiedLaunches: number;
        unverifiedLaunches: number;
        updatesByProject: Map<string, number>;
        totalVolumeWei: bigint;
        projectsTraded: Set<string>;
        tradeCount: number;
      }
    >();

    function getOrCreate(wallet: string) {
      const key = wallet.toLowerCase();
      let entry = walletMap.get(key);
      if (!entry) {
        entry = {
          verifiedLaunches: 0,
          unverifiedLaunches: 0,
          updatesByProject: new Map(),
          totalVolumeWei: 0n,
          projectsTraded: new Set(),
          tradeCount: 0,
        };
        walletMap.set(key, entry);
      }
      return entry;
    }

    for (const p of projects) {
      const entry = getOrCreate(p.creatorAddress);
      if (p.isVerified) entry.verifiedLaunches += 1;
      else entry.unverifiedLaunches += 1;
    }

    for (const u of updates) {
      const entry = getOrCreate(u.authorAddress);
      entry.updatesByProject.set(u.projectId, (entry.updatesByProject.get(u.projectId) ?? 0) + 1);
    }

    for (const t of trades) {
      const entry = getOrCreate(t.traderAddress);
      try {
        entry.totalVolumeWei += BigInt(t.ethAmount || "0");
      } catch {
        // Ignore malformed legacy values
      }
      entry.projectsTraded.add(t.projectId);
      entry.tradeCount += 1;
    }

    const activities: WalletActivityInput[] = Array.from(walletMap.entries()).map(
      ([walletAddress, d]) => ({
        walletAddress,
        verifiedLaunches: d.verifiedLaunches,
        unverifiedLaunches: d.unverifiedLaunches,
        updatesPerProject: Array.from(d.updatesByProject.values()),
        totalVolumeWei: d.totalVolumeWei,
        uniqueProjectsTraded: d.projectsTraded.size,
        tradeCount: d.tradeCount,
      })
    );

    const ranked = computeSeasonRewards(activities, referrals);
    const totalPointsDistributed = ranked.reduce((sum, r) => sum + r.totalPoints, 0);

    let walletData = null;
    if (targetWallet) {
      const idx = ranked.findIndex((r) => r.walletAddress === targetWallet);
      const referredByEdge = referrals.find(
        (r) => r.refereeAddress.toLowerCase() === targetWallet
      );
      const summary =
        idx >= 0
          ? ranked[idx]
          : {
              walletAddress: targetWallet,
              tier: "Explorer" as const,
              launchPoints: 0,
              updatePoints: 0,
              tradingPoints: 0,
              earlySupporterPoints: 0,
              referralPoints: 0,
              totalPoints: 0,
              launchesCount: 0,
              tradesCount: 0,
              activeReferralsCount: 0,
              pendingReferralsCount: 0,
            };

      walletData = {
        rank: idx >= 0 ? idx + 1 : null,
        referredBy: referredByEdge?.referrerAddress ?? null,
        ...summary,
      };
    }

    return NextResponse.json({
      season: "Season 1 · Testnet Genesis",
      rules: POINTS_CONFIG,
      totalParticipants: ranked.length,
      totalPointsDistributed,
      leaderboard: ranked.slice(0, 50).map((item, i) => ({ rank: i + 1, ...item })),
      wallet: walletData,
    });
  } catch (err) {
    console.error("[GET /api/rewards] error:", err);
    return NextResponse.json({ error: "Failed to load rewards data" }, { status: 500 });
  }
}
