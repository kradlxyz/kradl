import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const address = await getSessionAddress();
  if (!address) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  const user = await prisma.user.findUnique({ where: { walletAddress: address } });
  return NextResponse.json({ authenticated: true, address, user });
}
