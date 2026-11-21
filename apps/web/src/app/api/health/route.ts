import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const syncStates = await prisma.syncState.findMany();
    return NextResponse.json({
      status: "ok",
      service: "kradl-web",
      timestamp: new Date().toISOString(),
      syncStates: syncStates.map((s) => ({
        chainId: s.chainId,
        lastSyncedBlock: s.lastSyncedBlock.toString(),
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "DB unavailable" },
      { status: 503 }
    );
  }
}
