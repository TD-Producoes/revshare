import crypto from "crypto";

// Use a strong KDF without adding native deps.
// Stored format: scrypt$N$r$p$saltB64$hashB64
const SCRYPT_N = 1 << 15;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const SALT_BYTES = 16;
const KEY_LEN = 32;

export function generateOpaqueToken(bytes = 32): string {
  // base64url is URL-safe and compact
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashAgentSecret(secret: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derivedKey = crypto.scryptSync(secret, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_r),
    String(SCRYPT_p),
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Verify an agent secret against its scrypt hash.
 */
export function verifyAgentSecret(secret: string, hashedSecret: string): boolean {
  const parts = hashedSecret.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const N = parseInt(parts[1], 10);
  const r = parseInt(parts[2], 10);
  const p = parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], "base64");
  const storedKey = Buffer.from(parts[5], "base64");

  try {
    const derivedKey = crypto.scryptSync(secret, salt, storedKey.length, {
      N,
      r,
      p,
      maxmem: 64 * 1024 * 1024,
    });

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(storedKey, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate a secure claim ID (single-use, unguessable).
 * 16 bytes = 128 bits of entropy.
 */
export function generateClaimId(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/**
 * Generate an idempotency key if the client doesn't provide one.
 */
export function generateIdempotencyKey(): string {
  return `auto_${Date.now()}_${crypto.randomBytes(8).toString("base64url")}`;
}
