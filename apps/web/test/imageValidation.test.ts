import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_LOGO_BYTES, validateSafeImageBytes } from "../src/lib/imageValidation";

describe("@kradl/web logo image magic-byte validator", () => {
  it("accepts valid PNG, JPEG, and WebP magic headers", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

    assert.deepEqual(validateSafeImageBytes(png), { ok: true, mimeType: "image/png" });
    assert.deepEqual(validateSafeImageBytes(jpg), { ok: true, mimeType: "image/jpeg" });
    assert.deepEqual(validateSafeImageBytes(webp), { ok: true, mimeType: "image/webp" });
  });

  it("blocks SVG/HTML XSS payloads and oversized files", () => {
    const svgXss = new TextEncoder().encode('<svg onload="alert(1)"></svg>');
    assert.equal(validateSafeImageBytes(svgXss).ok, false);

    const hugePng = new Uint8Array(MAX_LOGO_BYTES + 1);
    hugePng.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(validateSafeImageBytes(hugePng).ok, false);

    assert.equal(validateSafeImageBytes(new Uint8Array(4)).ok, false);
  });
});
