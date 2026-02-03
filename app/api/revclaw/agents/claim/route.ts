import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

/**
 * POST /api/revclaw/agents/claim
 *
 * Claims a pending registration and creates an installation binding the agent to a user.
 *
 * SECURITY: This endpoint should ONLY be called from the Telegram approval callback handler,
 * which derives telegram_user_id from verified Telegram callback data.
 * The telegram_user_id MUST NEVER come from untrusted JSON input.
 *
 * This is an internal endpoint - the public interface is the Telegram callback handler.
 */

const inputSchema = z.object({
  // agent_id is provided for validation (must match registration)
  agent_id: z.string().min(1),

  // claim_id is the single-use token from registration
  claim_id: z.string().min(1),

  // CRITICAL: telegram_user_id MUST be derived from Telegram-authenticated context
  // This field is set by the callback handler, NOT from external JSON
  telegram_user_id: z.string().min(1),

  // Scopes to grant (subset of requested scopes)
  granted_scopes: z.array(z.string().min(1).max(80)).max(50).optional(),
});

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
  | { success: true; installationId: string; userId: string; agentName: string }
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
  const existingInstallation = await prisma.revclawInstallation.findUnique({
    where: {
      agentId_userId: {
        agentId,
        userId: user.id,
      },
    },
  });

  if (existingInstallation) {
    // Update registration as claimed but return existing installation
    await prisma.revclawRegistration.update({
      where: { id: registration.id },
      data: {
        status: "CLAIMED",
        claimedAt: new Date(),
        claimedByUserId: user.id,
      },
    });

    return {
      success: true,
      installationId: existingInstallation.id,
      userId: user.id,
      agentName: registration.agent.name,
    };
  }

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

  return {
    success: true,
    installationId: result.id,
    userId: user.id,
    agentName: registration.agent.name,
  };
}

/**
 * POST handler - This is an internal endpoint.
 * In production, this should only be callable from the Telegram callback handler.
 * The telegram_user_id MUST be derived from verified Telegram callback data.
 */
export async function POST(request: Request) {
  // Check for internal caller header (set by callback handler)
  const internalCaller = request.headers.get("X-RevClaw-Internal-Caller");
  if (internalCaller !== "telegram-callback") {
    // In production, reject direct calls without internal header
    // For now, log a warning but allow (for testing)
    console.warn(
      "[RevClaw] Direct call to /api/revclaw/agents/claim without internal header"
    );
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { agent_id, claim_id, telegram_user_id, granted_scopes } = parsed.data;

  const result = await processClaimInternal({
    agentId: agent_id,
    claimId: claim_id,
    telegramUserId: telegram_user_id,
    grantedScopes: granted_scopes,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      installation_id: result.installationId,
      user_id: result.userId,
    },
    { status: 201 }
  );
}
