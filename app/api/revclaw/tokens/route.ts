import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAgentSecret } from "@/lib/revclaw/secret";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenExpiration,
  getRefreshTokenExpiration,
  getExpiresInSeconds,
  extractBearerToken,
  verifyTokenHash,
  redactToken,
} from "@/lib/revclaw/tokens";

/**
 * POST /api/revclaw/tokens - Token Exchange
 * 
 * Exchange an exchange_code for access_token + refresh_token.
 * 
 * Authentication: Bot (agent_id + agent_secret)
 * Input: { agent_id, agent_secret, exchange_code }
 * Output: { access_token, refresh_token, expires_in, token_type: "Bearer" }
 */

const exchangeSchema = z.object({
  agent_id: z.string().min(1),
  agent_secret: z.string().min(1),
  exchange_code: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = exchangeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agent_id, agent_secret, exchange_code } = parsed.data;

    // 1. Verify agent exists and is active
    const agent = await prisma.revclawAgent.findUnique({
      where: { id: agent_id },
      select: {
        id: true,
        agentSecretHash: true,
        status: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Invalid agent_id" },
        { status: 401 }
      );
    }

    if (agent.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Agent is not active" },
        { status: 403 }
      );
    }

    // 2. Verify agent_secret
    if (!verifyAgentSecret(agent_secret, agent.agentSecretHash)) {
      console.error("[RevClaw] Token exchange failed: invalid agent_secret", {
        agent_id,
        // Never log the secret itself
      });
      return NextResponse.json(
        { error: "Invalid agent_secret" },
        { status: 401 }
      );
    }

    // 3. Find and validate exchange code
    const codeHash = hashToken(exchange_code);
    const exchangeCodeRecord = await prisma.revclawExchangeCode.findUnique({
      where: { codeHash },
      include: {
        installation: {
          select: {
            id: true,
            agentId: true,
            userId: true,
            grantedScopes: true,
            status: true,
          },
        },
      },
    });

    if (!exchangeCodeRecord) {
      console.error("[RevClaw] Token exchange failed: invalid exchange_code", {
        agent_id,
        code_redacted: redactToken(exchange_code),
      });
      return NextResponse.json(
        { error: "Invalid exchange_code" },
        { status: 401 }
      );
    }

    // 4. Verify exchange code belongs to this agent
    if (exchangeCodeRecord.installation.agentId !== agent_id) {
      return NextResponse.json(
        { error: "exchange_code does not belong to this agent" },
        { status: 403 }
      );
    }

    // 5. Check exchange code status
    if (exchangeCodeRecord.status !== "PENDING") {
      console.error("[RevClaw] Token exchange failed: code already used or expired", {
        agent_id,
        status: exchangeCodeRecord.status,
      });
      return NextResponse.json(
        { error: `Exchange code is ${exchangeCodeRecord.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // 6. Check if expired
    if (exchangeCodeRecord.expiresAt < new Date()) {
      await prisma.revclawExchangeCode.update({
        where: { id: exchangeCodeRecord.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Exchange code has expired" },
        { status: 410 }
      );
    }

    // 7. Check installation is active
    if (exchangeCodeRecord.installation.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Installation is not active" },
        { status: 403 }
      );
    }

    // 8. Generate token pair
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();
    const accessTokenHash = hashToken(accessToken);
    const refreshTokenHash = hashToken(refreshToken);
    const accessTokenExpiry = getAccessTokenExpiration();
    const refreshTokenExpiry = getRefreshTokenExpiration();
    const scopesSnapshot = exchangeCodeRecord.scopesSnapshot;

    // 9. Store tokens and mark exchange code as used (transaction)
    await prisma.$transaction(async (tx) => {
      // Mark exchange code as used
      await tx.revclawExchangeCode.update({
        where: { id: exchangeCodeRecord.id },
        data: {
          status: "USED",
          usedAt: new Date(),
        },
      });

      // Create access token record
      await tx.revclawAccessToken.create({
        data: {
          installationId: exchangeCodeRecord.installationId,
          tokenHash: accessTokenHash,
          tokenType: "ACCESS",
          scopesSnapshot,
          expiresAt: accessTokenExpiry,
        },
      });

      // Create refresh token record
      await tx.revclawAccessToken.create({
        data: {
          installationId: exchangeCodeRecord.installationId,
          tokenHash: refreshTokenHash,
          tokenType: "REFRESH",
          scopesSnapshot,
          expiresAt: refreshTokenExpiry,
        },
      });

      // Update installation last token issued timestamp
      await tx.revclawInstallation.update({
        where: { id: exchangeCodeRecord.installationId },
        data: { lastTokenIssuedAt: new Date() },
      });
    });

    console.log("[RevClaw] Token exchange successful", {
      agent_id,
      installation_id: exchangeCodeRecord.installationId,
      scopes: scopesSnapshot,
    });

    // 10. Return token pair (ONLY time tokens are sent plaintext)
    return NextResponse.json(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: getExpiresInSeconds(),
        scopes: scopesSnapshot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RevClaw] Token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
