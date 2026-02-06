import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  TOKEN_REFRESH_LIMIT,
} from "@/lib/revclaw/rate-limit";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenExpiration,
  getRefreshTokenExpiration,
  getExpiresInSeconds,
  extractBearerToken,
} from "@/lib/revclaw/tokens";

/**
 * POST /api/revclaw/tokens/refresh - Token Refresh (Rotation)
 * 
 * Rotate refresh_token to get new access_token + refresh_token.
 * 
 * Authentication: Bearer token (refresh_token in Authorization header)
 * Input: {} (empty, token in header)
 * Output: { access_token, refresh_token, expires_in, token_type: "Bearer" }
 * 
 * Security: Detects refresh token reuse and invalidates entire chain.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`token_refresh:${ip}`, TOKEN_REFRESH_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds!);

  try {
    const authHeader = request.headers.get("Authorization");
    const refreshToken = extractBearerToken(authHeader);

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const refreshTokenHash = hashToken(refreshToken);

    // 1. Find refresh token
    const tokenRecord = await prisma.revclawAccessToken.findUnique({
      where: { tokenHash: refreshTokenHash },
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
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      console.error("[RevClaw] Token refresh failed: token not found");
      return NextResponse.json(
        { error: "Invalid refresh_token" },
        { status: 401 }
      );
    }

    // 2. Verify it's a refresh token
    if (tokenRecord.tokenType !== "REFRESH") {
      return NextResponse.json(
        { error: "Token is not a refresh_token" },
        { status: 400 }
      );
    }

    // 3. Check if token was already used (REPLAY ATTACK DETECTION)
    if (tokenRecord.refreshedAt) {
      console.error("[RevClaw] SECURITY: Refresh token reuse detected!", {
        installation_id: tokenRecord.installationId,
        token_id: tokenRecord.id,
      });

      // Invalidate entire token chain for this installation
      await prisma.revclawAccessToken.updateMany({
        where: {
          installationId: tokenRecord.installationId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "Refresh token reuse detected. All tokens revoked." },
        { status: 403 }
      );
    }

    // 4. Check if revoked
    if (tokenRecord.revokedAt) {
      return NextResponse.json(
        { error: "Refresh token has been revoked" },
        { status: 403 }
      );
    }

    // 5. Check if expired
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Refresh token has expired" },
        { status: 401 }
      );
    }

    // 6. Check installation is active
    if (tokenRecord.installation.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Installation is not active" },
        { status: 403 }
      );
    }

    // 7. Check agent is active
    if (tokenRecord.installation.agent.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Agent is not active" },
        { status: 403 }
      );
    }

    // 8. Generate new token pair
    const newAccessToken = generateAccessToken();
    const newRefreshToken = generateRefreshToken();
    const newAccessTokenHash = hashToken(newAccessToken);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const accessTokenExpiry = getAccessTokenExpiration();
    const refreshTokenExpiry = getRefreshTokenExpiration();
    const scopesSnapshot = tokenRecord.scopesSnapshot;

    // 9. Rotate tokens (transaction)
    await prisma.$transaction(async (tx) => {
      // Mark old refresh token as used (rotation)
      await tx.revclawAccessToken.update({
        where: { id: tokenRecord.id },
        data: {
          refreshedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });

      // Create new access token
      await tx.revclawAccessToken.create({
        data: {
          installationId: tokenRecord.installationId,
          tokenHash: newAccessTokenHash,
          tokenType: "ACCESS",
          scopesSnapshot,
          expiresAt: accessTokenExpiry,
        },
      });

      // Create new refresh token (track parent for chain validation)
      await tx.revclawAccessToken.create({
        data: {
          installationId: tokenRecord.installationId,
          tokenHash: newRefreshTokenHash,
          tokenType: "REFRESH",
          scopesSnapshot,
          expiresAt: refreshTokenExpiry,
          parentTokenId: tokenRecord.id,
        },
      });

      // Update installation last token issued timestamp
      await tx.revclawInstallation.update({
        where: { id: tokenRecord.installationId },
        data: { lastTokenIssuedAt: new Date() },
      });
    });

    console.log("[RevClaw] Token refresh successful", {
      installation_id: tokenRecord.installationId,
      agent_id: tokenRecord.installation.agentId,
    });

    await emitRevclawEvent({
      type: "REVCLAW_TOKEN_REFRESHED",
      agentId: tokenRecord.installation.agentId,
      userId: tokenRecord.installation.userId,
      subjectType: "RevclawInstallation",
      subjectId: tokenRecord.installationId,
      installationId: tokenRecord.installationId,
      initiatedBy: "agent",
      data: {
        scopes: scopesSnapshot,
      },
    });

    // 10. Return new token pair
    return NextResponse.json(
      {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: getExpiresInSeconds(),
        scopes: scopesSnapshot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RevClaw] Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
