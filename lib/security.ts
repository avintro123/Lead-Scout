import crypto from "crypto";

/**
 * LeadScout Security & Defensive Hardening Utilities
 * 1. SSRF Protection & URL Validation
 * 2. Input Sanitization & XSS Prevention
 * 3. Cryptographic PBKDF2 Password & Token Hashing
 */

// Private & reserved IPv4 blocks (CIDR representation)
const PRIVATE_IP_PATTERNS = [
  /^0\./,                                 // 0.0.0.0/8
  /^10\./,                                // 10.0.0.0/8 (Private)
  /^127\./,                               // 127.0.0.0/8 (Loopback)
  /^169\.254\./,                          // 169.254.0.0/16 (Link-local / Cloud metadata)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,       // 172.16.0.0/12 (Private)
  /^192\.168\./,                          // 192.168.0.0/16 (Private)
  /^192\.0\.2\./,                         // TEST-NET-1
  /^198\.51\.100\./,                      // TEST-NET-2
  /^203\.0\.113\./,                       // TEST-NET-3
  /^224\./,                               // Multicast
  /^240\./,                               // Reserved
  /^255\.255\.255\.255/,                  // Broadcast
];

// Dangerous hostnames (Cloud metadata, internal endpoints)
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",                      // AWS / GCP / Azure metadata service
  "metadata.internal",
  "instance-data",
  "kubernetes.default",
  "docker.for.mac",
  "docker.for.win",
]);

/**
 * Validates a target URL against SSRF attacks.
 * Rejects private IPs, loopbacks, cloud metadata endpoints, and non-HTTP protocols.
 */
export function validateAndSanitizeTargetUrl(rawUrl: string): {
  valid: boolean;
  cleanUrl?: string;
  domain?: string;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "Target URL or domain is required" };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 255) {
    return { valid: false, error: "Domain or URL exceeds maximum length (255 chars)" };
  }

  // Prepend https:// if protocol is missing
  let parsedUrlString = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    parsedUrlString = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(parsedUrlString);
  } catch {
    return { valid: false, error: "Malformed URL syntax" };
  }

  // Protocol check: Only allow HTTP and HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Invalid protocol. Only HTTP and HTTPS are permitted." };
  }

  // Reject credentials in URL (e.g. http://user:pass@evil.com)
  if (parsed.username || parsed.password) {
    return { valid: false, error: "Embedded authentication credentials in URL are prohibited." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Hostname blocklist
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: "Access to loopback or cloud metadata services is strictly blocked." };
  }

  // Rejects internal top-level domains
  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".corp") ||
    hostname.endsWith(".home")
  ) {
    return { valid: false, error: "Access to private or local network top-level domains is blocked." };
  }

  // Check IPv4 private ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: "Access to private or reserved IP addresses is strictly blocked." };
    }
  }

  // Check IPv6 loopback / local addresses
  if (
    hostname.startsWith("::") ||
    hostname.startsWith("fe80:") ||
    hostname.startsWith("fc00:") ||
    hostname.startsWith("fd00:")
  ) {
    return { valid: false, error: "Access to IPv6 private or loopback ranges is blocked." };
  }

  // Ensure hostname contains at least one dot (e.g. google.com, not just 'internalhost')
  if (!hostname.includes(".") && !hostname.match(/\d+$/)) {
    return { valid: false, error: "Invalid domain format. Standard public FQDN required." };
  }

  // Construct sanitized URL with default path if empty
  const sanitized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname || "/"}${parsed.search || ""}`;

  return {
    valid: true,
    cleanUrl: sanitized,
    domain: parsed.hostname,
  };
}

/**
 * Basic HTML/Script sanitization for user inputs to prevent stored and reflected XSS.
 */
export function sanitizeString(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[<>]/g, "") // Strip HTML tag angle brackets
    .trim();
}

/**
 * Validates domain string format (e.g. stripe.com)
 */
export function sanitizeDomain(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]/g, "");
  return cleaned.slice(0, 100);
}

/**
 * Validates UUID v4 string format
 */
export function isValidUUID(uuid: unknown): boolean {
  if (typeof uuid !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid.trim()
  );
}

// ---------------------------------------------------------------------------
// Cryptographic Password Hashing & Admin Session Management
// ---------------------------------------------------------------------------

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha256";

/**
 * Hashes a plaintext secret using PBKDF2 with a cryptographically secure random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return { hash, salt };
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash & salt using timing-safe comparison.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computedHash = crypto
      .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
      .toString("hex");

    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(expectedHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generates an HMAC-signed session token for admin authorization.
 */
export function createSignedSessionToken(
  subject: string,
  secretKey: string,
  expiresInSeconds = 86400 // 24 hours
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = Buffer.from(JSON.stringify({ sub: subject, exp: expiresAt })).toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-signed session token.
 */
export function verifySignedSessionToken(
  token: string,
  secretKey: string
): { valid: boolean; subject?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(payloadB64)
      .digest("base64url");

    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return { valid: false };
    }

    return { valid: true, subject: payload.sub };
  } catch {
    return { valid: false };
  }
}
