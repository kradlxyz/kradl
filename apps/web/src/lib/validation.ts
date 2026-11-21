import { z } from "zod";

/**
 * Strictly validates that a URL uses http:// or https:// only (blocks javascript:, data:, vbscript:, etc.).
 */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Strictly verifies that a URL points to an actual github.com repository path (prevents badge spoofing).
 */
export function isValidGithubRepoUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") return false;
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

export const safeOptionalUrlSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || isSafeHttpUrl(val), {
    message: "URL must use http:// or https://",
  })
  .optional()
  .or(z.literal(""));
