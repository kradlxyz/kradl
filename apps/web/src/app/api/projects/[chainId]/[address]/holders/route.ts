import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const holders = await prisma.holderBalance.findMany({
      where: { chainId, tokenAddress: address.toLowerCase() },
      take: 100,
    });

    // Sort descending by exact BigInt balance
    const sorted = holders
      .filter((h) => BigInt(h.balance) > 0n)
      .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1))
      .slice(0, 50);

    return NextResponse.json({ holders: sorted });
  } catch (error) {
    console.error("GET holders error:", error);
    return NextResponse.json({ error: "Failed to load holders" }, { status: 500 });
  }
}
