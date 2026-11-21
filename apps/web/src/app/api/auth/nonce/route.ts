import { NextResponse } from "next/server";
import { createAuthNonce } from "@/lib/auth";

export async function GET() {
  try {
    const nonce = await createAuthNonce();
    return NextResponse.json({ nonce });
  } catch {
    return NextResponse.json({ error: "Failed to create nonce" }, { status: 500 });
  }
}
