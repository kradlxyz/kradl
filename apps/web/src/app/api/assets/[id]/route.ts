import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || id.length > 64) {
      return new NextResponse("Not found", { status: 404 });
    }

    const asset = await prisma.uploadedAsset.findUnique({
      where: { id },
      select: { mimeType: true, data: true },
    });

    if (!asset) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(asset.data), {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal error", { status: 500 });
  }
}
