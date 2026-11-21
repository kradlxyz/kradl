import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndCreateSession } from "@/lib/auth";

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  message: z.string().min(20),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const expectedDomain = rawHost.replace(/:(443|80)$/, "") || undefined;

    const address = await verifyAndCreateSession({
      address: parsed.data.address,
      message: parsed.data.message,
      signature: parsed.data.signature as `0x${string}`,
      expectedDomain,
    });

    if (!address) {
      console.warn("[SIWE verify failed]", { expectedDomain, address: parsed.data.address });
      return NextResponse.json({ error: "Invalid signature or expired nonce" }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, address });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
