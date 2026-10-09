import { NextRequest } from "next/server";
import crypto from "crypto";
import {
  createSignedSessionToken,
  verifySignedSessionToken,
} from "./security";

export const ADMIN_COOKIE_NAME = "leadscout_admin_session";

// Server-side secret key used to sign session cookies
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.GEMINI_API_KEY ||
  "leadscout-fallback-auth-secret-key-99182371923";

// Default admin passphrase (can be set in .env.local as ADMIN_PASSPHRASE)
const CONFIGURED_ADMIN_PASS =
  process.env.ADMIN_PASSPHRASE || "scout-admin-2026";

/**
 * Validates whether the incoming Next.js request carries a valid signed Admin session.
 */
export function isAdminAuthenticated(req: NextRequest): boolean {
  try {
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!sessionCookie) return false;

    const verification = verifySignedSessionToken(sessionCookie, AUTH_SECRET);
    return verification.valid && verification.subject === "admin";
  } catch {
    return false;
  }
}

/**
 * Validates an admin password attempt using timing-safe comparison.
 */
export function verifyAdminPassword(inputPass: string): {
  success: boolean;
  token?: string;
  error?: string;
} {
  if (!inputPass || typeof inputPass !== "string") {
    return { success: false, error: "Admin passphrase is required" };
  }

  // Timing-safe comparison to prevent timing side-channel attacks
  const bufA = Buffer.from(inputPass.trim());
  const bufB = Buffer.from(CONFIGURED_ADMIN_PASS.trim());

  let isMatch = false;
  if (bufA.length === bufB.length) {
    isMatch = crypto.timingSafeEqual(bufA, bufB);
  }

  if (!isMatch) {
    return { success: false, error: "Invalid admin passphrase" };
  }

  const token = createSignedSessionToken("admin", AUTH_SECRET, 86400 * 7); // 7-day session
  return { success: true, token };
}
