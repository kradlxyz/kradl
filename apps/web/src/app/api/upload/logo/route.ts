import { NextRequest, NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateSafeImageBytes } from "@/lib/imageValidation";
import { getClientIp, globalRateLimiter } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rate = globalRateLimiter.check(`upload:${getClientIp(req)}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a minute." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const sessionAddress = await getSessionAddress();
  if (!sessionAddress) {
    return NextResponse.json(
      { error: "Please sign in with your wallet to upload a logo." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateSafeImageBytes(bytes);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const asset = await prisma.uploadedAsset.create({
      data: {
        mimeType: check.mimeType,
        data: Buffer.from(bytes),
        uploaderAddress: sessionAddress.toLowerCase(),
      },
      select: { id: true },
    });

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "kradl.xyz";
    const cleanHost = host.replace(/:(443|80)$/, "");
    const url = `${proto}://${cleanHost}/api/assets/${asset.id}`;

    return NextResponse.json({ id: asset.id, url }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/upload/logo] error:", err);
    return NextResponse.json({ error: "Failed to upload logo image." }, { status: 500 });
  }
}
