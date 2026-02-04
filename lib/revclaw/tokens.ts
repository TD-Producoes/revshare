import crypto from "crypto";
import { generateOpaqueToken, sha256Hex } from "./secret";

/**
 * Token lifecycle utilities for RevClaw OAuth-like flow.
 * 
 * Security principles:
 * - All tokens are hashed at rest (never stored plaintext)
 * - Access tokens: short-lived (5-15 minutes)
 * - Refresh tokens: rotating (reuse detection invalidates chain)
 * - Exchange codes: single-use, short-lived (5 minutes)
 * - Token format: opaque, URL-safe, high-entropy base64url
 */

export const TOKEN_CONFIG = {
  // Access token lifetime (5 minutes for high security)
  ACCESS_TOKEN_TTL_MS: 5 * 60 * 1000,
  
  // Refresh token lifetime (7 days)
  REFRESH_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  
  // Exchange code lifetime (5 minutes, single-use)
  EXCHANGE_CODE_TTL_MS: 5 * 60 * 1000,
  
  // Token byte lengths
  ACCESS_TOKEN_BYTES: 32,  // 256 bits
  REFRESH_TOKEN_BYTES: 32, // 256 bits
  EXCHANGE_CODE_BYTES: 24, // 192 bits
} as const;

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number; // seconds until access_token expires
  scopes: string[];
}

export interface ExchangeCodeData {
  code: string;
  code_hash: string;
  expires_at: Date;
}

/**
 * Generate a cryptographically secure access token.
 */
export function generateAccessToken(): string {
  return generateOpaqueToken(TOKEN_CONFIG.ACCESS_TOKEN_BYTES);
}

/**
 * Generate a cryptographically secure refresh token.
 */
export function generateRefreshToken(): string {
  return generateOpaqueToken(TOKEN_CONFIG.REFRESH_TOKEN_BYTES);
}

/**
 * Generate a single-use exchange code.
 */
export function generateExchangeCode(): ExchangeCodeData {
  const code = generateOpaqueToken(TOKEN_CONFIG.EXCHANGE_CODE_BYTES);
  const code_hash = hashToken(code);
  const expires_at = new Date(Date.now() + TOKEN_CONFIG.EXCHANGE_CODE_TTL_MS);
  
  return { code, code_hash, expires_at };
}

/**
 * Hash a token for storage (SHA-256).
 * Using SHA-256 instead of scrypt for tokens since:
 * - Tokens have high entropy (32 bytes random)
 * - Speed matters for token validation
 * - No risk of brute force on high-entropy tokens
 */
export function hashToken(token: string): string {
  return sha256Hex(token);
}

/**
 * Verify a token against its hash.
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const computedHash = hashToken(token);
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(hash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Calculate token expiration timestamp.
 */
export function getAccessTokenExpiration(): Date {
  return new Date(Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_TTL_MS);
}

export function getRefreshTokenExpiration(): Date {
  return new Date(Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_TTL_MS);
}

/**
 * Get expires_in value for token response (in seconds).
 */
export function getExpiresInSeconds(): number {
  return Math.floor(TOKEN_CONFIG.ACCESS_TOKEN_TTL_MS / 1000);
}

/**
 * Extract Bearer token from Authorization header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  
  return parts[1];
}

/**
 * Redact token for logging (show only first 8 chars).
 */
export function redactToken(token: string): string {
  if (!token || token.length < 8) return "[REDACTED]";
  return `${token.substring(0, 8)}...[REDACTED]`;
}

/**
 * Redact Authorization header for logging.
 */
export function redactAuthHeader(authHeader: string | null): string {
  if (!authHeader) return "[NONE]";
  
  const token = extractBearerToken(authHeader);
  if (!token) return "[INVALID]";
  
  return `Bearer ${redactToken(token)}`;
}
