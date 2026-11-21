import { NextRequest, NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateReferralBinding } from "@/lib/rewards";

export async function POST(req: NextRequest) {
  const sessionAddress = await getSessionAddress();
  if (!sessionAddress) {
    return NextResponse.json({ error: "Please sign in with your wallet first." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawReferrer = String(body.referrerAddress ?? "").trim().toLowerCase();
    const refereeAddress = sessionAddress.toLowerCase();

    const [existingForReferee, existingForReferrer] = await Promise.all([
      prisma.referral.findUnique({ where: { refereeAddress } }),
      /^0x[a-f0-9]{40}$/.test(rawReferrer)
        ? prisma.referral.findUnique({ where: { refereeAddress: rawReferrer } })
        : Promise.resolve(null),
    ]);

    const validation = validateReferralBinding({
      referrerAddress: rawReferrer,
      refereeAddress,
      existingReferrerForReferee: existingForReferee?.referrerAddress ?? null,
      referrerOfReferrer: existingForReferrer?.referrerAddress ?? null,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const created = await prisma.referral.create({
      data: {
        referrerAddress: validation.referrer,
        refereeAddress: validation.referee,
      },
    });

    return NextResponse.json({
      bound: true,
      referrerAddress: created.referrerAddress,
      refereeAddress: created.refereeAddress,
    });
  } catch (err) {
    console.error("[POST /api/rewards/referral] error:", err);
    return NextResponse.json({ error: "Failed to bind referral" }, { status: 500 });
  }
}
