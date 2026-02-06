import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { generateExchangeCode } from "@/lib/revclaw/tokens";

/**
 * POST /api/revclaw/agents/claim — BLOCKED (see POST handler below).
 *
 * processClaimInternal() is the only safe way to process claims.
 * It is imported directly by:
 *   - app/api/revclaw/telegram/callback/route.ts (Telegram approval)
 *   - app/api/revclaw/claims/[claimId]/approve/route.ts (web fallback)
 *
 * SECURITY: telegram_user_id MUST NEVER come from untrusted JSON input.
 */

/**
 * Internal claim processing function.
 * Called by the Telegram callback handler with verified telegram_user_id.
 */
export async function processClaimInternal(params: {
  agentId: string;
  claimId: string;
  telegramUserId: string;
  grantedScopes?: string[];
}): Promise<
  | { success: true; installationId: string; userId: string; agentName: string; exchangeCode: string }
  | { success: false; error: string; status: number }
> {
  const { agentId, claimId, telegramUserId, grantedScopes } = params;

  // 1. Find the registration by claim_id
  const registration = await prisma.revclawRegistration.findUnique({
    where: { claimId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!registration) {
    return { success: false, error: "Invalid claim_id", status: 404 };
  }

  // 2. Validate agent_id matches
  if (registration.agentId !== agentId) {
    return { success: false, error: "agent_id does not match claim", status: 400 };
  }

  // 3. Check if agent is active
  if (registration.agent.status !== "ACTIVE") {
    return { success: false, error: "Agent is not active", status: 403 };
  }

  // 4. Check if already claimed
  if (registration.status === "CLAIMED") {
    return { success: false, error: "Claim already used", status: 409 };
  }

  // 5. Check if expired
  if (registration.status === "EXPIRED" || registration.expiresAt < new Date()) {
    // Update status if not already marked
    if (registration.status !== "EXPIRED") {
      await prisma.revclawRegistration.update({
        where: { id: registration.id },
        data: { status: "EXPIRED" },
      });
    }
    return { success: false, error: "Claim has expired", status: 410 };
  }

  // 6. Check if revoked
  if (registration.status === "REVOKED") {
    return { success: false, error: "Claim has been revoked", status: 403 };
  }

  // 7. Check status is PENDING
  if (registration.status !== "PENDING") {
    return { success: false, error: "Invalid claim status", status: 400 };
  }

  // 8. Find or create user by telegram_user_id
  let user = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true },
  });

  if (!user) {
    // Create provisional user anchored to Telegram identity
    user = await prisma.user.create({
      data: {
        id: `tg_${telegramUserId}_${Date.now()}`,
        telegramUserId,
        name: `Telegram User ${telegramUserId.slice(-4)}`,
        role: "founder", // Default role; can be changed later
        // email is null - will be set when user verifies email
        // pendingEmail can be set later via separate flow
      },
      select: { id: true },
    });
  }

  // 9. Determine granted scopes (default to requested if not specified)
  const scopesToGrant = grantedScopes ?? registration.requestedScopes;

  // 10. Check if installation already exists for this agent-user pair
  let existingInstallation = await prisma.revclawInstallation.findUnique({
    where: {
      agentId_userId: {
        agentId,
        userId: user.id,
      },
    },
  });

  let installationId: string;

  if (existingInstallation) {
    // Update registration as claimed but use existing installation
    await prisma.revclawRegistration.update({
      where: { id: registration.id },
      data: {
        status: "CLAIMED",
        claimedAt: new Date(),
        claimedByUserId: user.id,
      },
    });

    installationId = existingInstallation.id;
  } else {
    // 11. Create installation and mark registration as claimed in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark registration as claimed
      await tx.revclawRegistration.update({
        where: { id: registration.id },
        data: {
          status: "CLAIMED",
          claimedAt: new Date(),
          claimedByUserId: user.id,
        },
      });

      // Create installation
      const installation = await tx.revclawInstallation.create({
        data: {
          agentId,
          userId: user.id,
          grantedScopes: scopesToGrant,
          status: "ACTIVE",
          // Default policy: require approval for high-risk actions
          requireApprovalForPublish: true,
          requireApprovalForApply: true,
        },
        select: { id: true },
      });

      return installation;
    });

    installationId = result.id;
  }

  // 12. Generate exchange code for token issuance
  const exchangeCodeData = generateExchangeCode();

  await prisma.revclawExchangeCode.create({
    data: {
      installationId,
      codeHash: exchangeCodeData.code_hash,
      scopesSnapshot: scopesToGrant,
      status: "PENDING",
      expiresAt: exchangeCodeData.expires_at,
    },
  });

  await emitRevclawEvent({
    type: "REVCLAW_AGENT_CLAIMED",
    agentId,
    userId: user.id,
    subjectType: "RevclawInstallation",
    subjectId: installationId,
    installationId,
    initiatedBy: "user",
    data: {
      granted_scopes: scopesToGrant,
    },
  });

  return {
    success: true,
    installationId,
    userId: user.id,
    agentName: registration.agent.name,
    exchangeCode: exchangeCodeData.code,
  };
}

/**
 * POST handler - BLOCKED.
 *
 * This HTTP route is intentionally disabled. All legitimate callers
 * (Telegram callback, web claim approval) import processClaimInternal()
 * directly as a function — they never HTTP-call this route.
 *
 * Exposing a public POST that accepts telegram_user_id from JSON would
 * allow identity spoofing, so we reject unconditionally.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Direct calls to this endpoint are not allowed. Claims must be processed through the Telegram approval flow or the web claim approval page.",
    },
    { status: 403 }
  );
}
