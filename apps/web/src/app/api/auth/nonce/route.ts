import { NextRequest, NextResponse } from "next/server";
import { createAuthNonce } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, globalRateLimiter } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = globalRateLimiter.check(`nonce:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  try {
    // Opportunistically prune expired nonces so the table never bloats
    prisma.authNonce
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {});

    const nonce = await createAuthNonce();
    return NextResponse.json({ nonce });
  } catch {
    return NextResponse.json({ error: "Failed to create nonce" }, { status: 500 });
  }
}
