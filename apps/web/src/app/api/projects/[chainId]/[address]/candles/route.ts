import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_INTERVALS = new Set(["1m", "5m", "15m", "1h", "1d"]);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const { chainId: chainIdStr, address } = await context.params;
    const chainId = Number(chainIdStr);
    const interval = new URL(req.url).searchParams.get("interval") || "5m";

    if (Number.isNaN(chainId) || !VALID_INTERVALS.has(interval)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const candles = await prisma.candle.findMany({
      where: {
        chainId,
        tokenAddress: address.toLowerCase(),
        interval,
      },
      orderBy: { bucketTime: "asc" },
      take: 500,
    });

    return NextResponse.json({
      candles: candles.map((c) => ({
        time: Math.floor(c.bucketTime.getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volumeEth,
      })),
    });
  } catch (error) {
    console.error("GET candles error:", error);
    return NextResponse.json({ error: "Failed to load candles" }, { status: 500 });
  }
}
