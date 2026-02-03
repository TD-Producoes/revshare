/**
 * RevClaw Authentication & Authorization
 * 
 * Middleware utilities for validating access tokens and checking scopes.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, hashToken } from "./tokens";

export interface AuthenticatedAgent {
  agentId: string;
  userId: string;
  installationId: string;
  scopes: string[];
  tokenId: string;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Authenticate a request using Bearer token.
 * Validates access token and returns agent context.
 * 
 * Usage in API routes:
 * ```
 * const agent = await authenticateAgent(request);
 * if (!agent.scopes.includes("project:publish")) {
 *   throw new AuthError("Missing required scope", 403);
 * }
 * ```
 */
export async function authenticateAgent(
  request: Request
): Promise<AuthenticatedAgent> {
  // 1. Extract Bearer token from Authorization header
  const authHeader = request.headers.get("Authorization");
  const accessToken = extractBearerToken(authHeader);

  if (!accessToken) {
    throw new AuthError("Missing or invalid Authorization header", 401);
  }

  const tokenHash = hashToken(accessToken);

  // 2. Find and validate access token
  const tokenRecord = await prisma.revclawAccessToken.findUnique({
    where: { tokenHash },
    include: {
      installation: {
        select: {
          id: true,
          agentId: true,
          userId: true,
          grantedScopes: true,
          status: true,
          agent: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!tokenRecord) {
    throw new AuthError("Invalid access token", 401);
  }

  // 3. Verify it's an access token (not refresh token)
  if (tokenRecord.tokenType !== "ACCESS") {
    throw new AuthError("Token is not an access token", 400);
  }

  // 4. Check if revoked
  if (tokenRecord.revokedAt) {
    throw new AuthError("Access token has been revoked", 403);
  }

  // 5. Check if expired
  if (tokenRecord.expiresAt < new Date()) {
    throw new AuthError("Access token has expired", 401);
  }

  // 6. Check installation is active
  if (tokenRecord.installation.status !== "ACTIVE") {
    throw new AuthError("Installation is not active", 403);
  }

  // 7. Check agent is active
  if (tokenRecord.installation.agent.status !== "ACTIVE") {
    throw new AuthError("Agent is not active", 403);
  }

  // 8. Update last used timestamp (async, don't wait)
  prisma.revclawAccessToken
    .update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => {
      console.error("[RevClaw] Failed to update token lastUsedAt:", err);
    });

  // 9. Return authenticated agent context
  return {
    agentId: tokenRecord.installation.agentId,
    userId: tokenRecord.installation.userId,
    installationId: tokenRecord.installationId,
    scopes: tokenRecord.scopesSnapshot,
    tokenId: tokenRecord.id,
  };
}

/**
 * Require specific scope(s) for an operation.
 * Throws AuthError if scope is missing.
 */
export function requireScope(agent: AuthenticatedAgent, requiredScope: string): void {
  if (!agent.scopes.includes(requiredScope)) {
    throw new AuthError(
      `Missing required scope: ${requiredScope}`,
      403
    );
  }
}

/**
 * Check if agent has a specific scope.
 */
export function hasScope(agent: AuthenticatedAgent, scope: string): boolean {
  return agent.scopes.includes(scope);
}

/**
 * Convert AuthError to NextResponse.
 */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  
  console.error("[RevClaw] Unexpected auth error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
