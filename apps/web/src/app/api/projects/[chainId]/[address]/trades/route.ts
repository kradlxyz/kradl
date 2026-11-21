import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const { chainId: chainIdStr, address } = await context.params;
    const chainId = Number(chainIdStr);
    const limit = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("limit") || 50)));

    if (Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }

    const trades = await prisma.trade.findMany({
      where: { chainId, tokenAddress: address.toLowerCase() },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({
      trades: trades.map((t) => ({
        ...t,
        blockNumber: t.blockNumber.toString(),
      })),
    });
  } catch (error) {
    console.error("GET trades error:", error);
    return NextResponse.json({ error: "Failed to load trades" }, { status: 500 });
  }
}
