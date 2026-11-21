export const MAX_LOGO_BYTES = 512 * 1024; // 512 KB

export type SafeImageMime = "image/png" | "image/jpeg" | "image/webp";

/**
 * Validates raw file bytes by inspecting magic numbers only (never trusts client MIME type).
 * Allows PNG, JPEG, and WebP up to 512 KB; strictly blocks SVG/HTML/scripts to prevent stored XSS.
 */
export function validateSafeImageBytes(
  bytes: Uint8Array
): { ok: true; mimeType: SafeImageMime } | { ok: false; error: string } {
  if (!bytes || bytes.byteLength < 12) {
    return { ok: false, error: "Image file is empty or corrupted." };
  }
  if (bytes.byteLength > MAX_LOGO_BYTES) {
    return { ok: false, error: "Logo image must be 512 KB or smaller." };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { ok: true, mimeType: "image/png" };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ok: true, mimeType: "image/jpeg" };
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { ok: true, mimeType: "image/webp" };
  }

  return { ok: false, error: "Only PNG, JPG, or WebP images are allowed." };
}
