/**
 * RevClaw Cryptographic Utilities
 *
 * Provides secure hashing and verification for:
 * - Audit log hash chaining (tamper-evident)
 * - Payload hashing for intent integrity
 * - Token hashing for refresh tokens
 *
 * Note: Agent secret hashing is in secret.ts (uses scrypt)
 */

import crypto from "crypto";

// =============================================================================
// Token Hashing (for refresh tokens - fast lookup)
// =============================================================================

/**
 * Hash a token using SHA-256 (for fast lookup scenarios like refresh tokens).
 * For agent secrets that need stronger protection, use hashAgentSecret from secret.ts.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a token against its hash (constant-time comparison).
 */
export function verifyToken(token: string, hashedToken: string): boolean {
  const computedHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(hashedToken, "hex")
  );
}

// =============================================================================
// Payload Hashing (for intent integrity)
// =============================================================================

/**
 * Compute SHA-256 hash of a JSON payload for integrity verification.
 * The payload is canonicalized (sorted keys) before hashing.
 */
export function hashPayload(payload: unknown): string {
  const canonical = JSON.stringify(payload, Object.keys(payload as object).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

// =============================================================================
// Audit Log Hash Chaining (tamper-evident)
// =============================================================================

export interface AuditLogEntry {
  sequence: bigint | number;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
  payload?: unknown;
  previousHash: string | null;
}

/**
 * Compute the hash for an audit log entry.
 * Hash = SHA-256(sequence | previousHash | action | resourceType | resourceId | timestamp | payload)
 *
 * This creates a hash chain where each entry's hash depends on the previous entry,
 * making tampering detectable.
 */
export function computeAuditLogHash(entry: AuditLogEntry): string {
  const data = [
    entry.sequence.toString(),
    entry.previousHash ?? "GENESIS",
    entry.action,
    entry.resourceType,
    entry.resourceId,
    entry.createdAt.toISOString(),
    entry.payload ? JSON.stringify(entry.payload, Object.keys(entry.payload as object).sort()) : "",
  ].join("|");

  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify the integrity of an audit log entry against its stored hash.
 */
export function verifyAuditLogEntry(entry: AuditLogEntry, storedHash: string): boolean {
  const computedHash = computeAuditLogHash(entry);
  // Use constant-time comparison even though this isn't a secret
  // (defense in depth)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

/**
 * Verify a chain of audit log entries for tampering.
 * Returns the index of the first invalid entry, or -1 if all valid.
 */
export function verifyAuditLogChain(
  entries: Array<AuditLogEntry & { entryHash: string }>
): number {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Verify this entry's hash
    if (!verifyAuditLogEntry(entry, entry.entryHash)) {
      return i;
    }

    // Verify chain linkage (except for first entry)
    if (i > 0) {
      const previousEntry = entries[i - 1];
      if (entry.previousHash !== previousEntry.entryHash) {
        return i;
      }
    }
  }

  return -1; // All valid
}

// =============================================================================
// Secure Random Generation
// =============================================================================

/**
 * Generate a cryptographically secure random string for secrets/tokens.
 * Uses URL-safe base64 encoding.
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString("base64url");
}
