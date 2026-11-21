import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verifyMessage, getAddress } from "viem";
import crypto from "crypto";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "kradl_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be configured with at least 32 characters in production");
    }
    return new TextEncoder().encode("kradl-dev-only-jwt-secret-change-in-production");
  }
  return new TextEncoder().encode(secret);
}

export async function createAuthNonce(): Promise<string> {
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await prisma.authNonce.create({
    data: { nonce, expiresAt },
  });
  return nonce;
}

export function buildSiweMessage(params: {
  address: string;
  nonce: string;
  chainId: number;
  domain: string;
}): string {
  const checksummed = getAddress(params.address);
  return [
    `${params.domain} wants you to sign in with your Ethereum account:`,
    checksummed,
    "",
    "Sign in to Kradl to manage your launched apps, post builder updates, and join discussions.",
    "",
    `Chain ID: ${params.chainId}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

export async function verifyAndCreateSession(params: {
  address: string;
  message: string;
  signature: `0x${string}`;
  expectedDomain?: string;
}): Promise<string | null> {
  // Bind signature to current domain & signer address to prevent cross-site phishing replay
  if (params.expectedDomain) {
    const firstLine = (params.message.split("\n")[0] ?? "").toLowerCase();
    const expected = params.expectedDomain.toLowerCase();
    const expectedNoWww = expected.replace(/^www\./, "");
    const domainMatches =
      firstLine.startsWith(`${expected} wants you to sign in`) ||
      firstLine.startsWith(`${expectedNoWww} wants you to sign in`) ||
      firstLine.startsWith(`www.${expectedNoWww} wants you to sign in`);
    if (!domainMatches) {
      console.warn("[SIWE domain mismatch]", { firstLine, expected });
      return null;
    }
  }
  const checksummed = getAddress(params.address);
  if (!params.message.includes(checksummed) && !params.message.toLowerCase().includes(params.address.toLowerCase())) {
    return null;
  }

  const nonceMatch = params.message.match(/Nonce:\s*([a-f0-9]+)/i);
  if (!nonceMatch) return null;
  const nonce = nonceMatch[1];

  const nonceRecord = await prisma.authNonce.findUnique({ where: { nonce } });
  if (!nonceRecord || nonceRecord.expiresAt < new Date()) {
    return null;
  }

  const valid = await verifyMessage({
    address: params.address as `0x${string}`,
    message: params.message,
    signature: params.signature,
  });
  if (!valid) return null;

  // Consume nonce (prevent replay)
  await prisma.authNonce.delete({ where: { nonce } }).catch(() => {});

  const normalizedAddress = params.address.toLowerCase();

  // Ensure User record exists
  await prisma.user.upsert({
    where: { walletAddress: normalizedAddress },
    update: {},
    create: { walletAddress: normalizedAddress },
  });

  const token = await new SignJWT({ sub: normalizedAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return normalizedAddress;
}

export async function getSessionAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.sub === "string" && /^0x[a-f0-9]{40}$/.test(payload.sub)) {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
