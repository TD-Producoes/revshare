import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuthUser, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/revclaw/intent-auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { hashToken } from "@/lib/revclaw/crypto";

/**
 * POST /api/revclaw/intents/:id/approve
 *
 * Human approval of an action intent.
 *
 * Authentication: Session-based (human user)
 *
 * Flow:
 * 1. Verify user is authenticated
 * 2. Verify user owns the installation
 * 3. Check intent is PENDING_APPROVAL and not expired
 * 4. Set status to APPROVED
 * 5. Log approval (audit trail)
 *
 * Output: { intent_id, status: "approved" }
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

const approveInput = z.object({
  // Optional: allow overriding scopes for this specific approval
  // (only if installation policy allows scope override)
  scopes_override: z.array(z.string()).optional(),
}).optional();

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: intentId } = await params;

  // Magic-link mode (no session): accept token via query ?token=...
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  let authUser: { id: string } | null = null;
  let approvedVia: "session" | "magic_link" = "session";

  if (!token) {
    // Session-based approval
    try {
      authUser = await requireAuthUser();
    } catch (error) {
      return authErrorResponse(error);
    }
  } else {
    approvedVia = "magic_link";
  }

  // Parse optional input
  const body = await request.json().catch(() => ({}));
  const parsed = approveInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Find the intent
  const intent = await prisma.revclawIntent.findUnique({
    where: { id: intentId },
    include: {
      installation: {
        select: {
          id: true,
          userId: true,
          agentId: true,
          agent: { select: { name: true } },
        },
      },
    },
  });

  if (!intent) {
    return NextResponse.json(
      { error: "Intent not found", code: "intent_not_found" },
      { status: 404 }
    );
  }

  // Verify approval authorization
  if (token) {
    const tokenHash = hashToken(token);
    const validToken =
      intent.approvalTokenHash &&
      intent.approvalTokenHash === tokenHash &&
      !intent.approvalTokenUsedAt &&
      (!intent.approvalTokenExpiresAt || intent.approvalTokenExpiresAt > new Date());

    if (!validToken) {
      return NextResponse.json(
        { error: "Invalid or expired approval token", code: "invalid_approval_token" },
        { status: 403 }
      );
    }
  } else {
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (intent.installation.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You do not own this installation", code: "forbidden" },
        { status: 403 }
      );
    }
  }

  // Check intent status
  if (intent.status !== "PENDING_APPROVAL") {
    const statusMessages: Record<string, string> = {
      APPROVED: "Intent is already approved",
      DENIED: "Intent has been denied",
      EXECUTED: "Intent has already been executed",
      EXPIRED: "Intent has expired",
    };
    const message = statusMessages[intent.status] ?? `Invalid intent status: ${intent.status}`;
    return NextResponse.json(
      { error: message, code: "intent_invalid_status", status: intent.status.toLowerCase() },
      { status: 409 }
    );
  }

  // Check expiration
  if (intent.expiresAt < new Date()) {
    // Update status to expired
    await prisma.revclawIntent.update({
      where: { id: intentId },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "Intent has expired", code: "intent_expired" },
      { status: 410 }
    );
  }

  // Approve the intent
  const now = new Date();
  await prisma.revclawIntent.update({
    where: { id: intentId },
    data: {
      status: "APPROVED",
      approvedAt: now,
      approvedPayloadHash: intent.payloadHash, // Lock the payload hash at approval time
      approvalTokenUsedAt: token ? now : intent.approvalTokenUsedAt,
    },
  });

  // Create audit log
  await createAuditLog({
    agentId: intent.agentId,
    userId: intent.installation.userId,
    action: "intent.approved",
    resourceType: "RevclawIntent",
    resourceId: intentId,
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
    payload: {
      kind: intent.kind,
      payload_hash: intent.payloadHash,
      approved_via: approvedVia,
      agent_name: intent.installation.agent.name,
    },
  });

  await emitRevclawEvent({
    type: "REVCLAW_INTENT_APPROVED",
    agentId: intent.agentId,
    userId: intent.installation.userId,
    subjectType: "RevclawIntent",
    subjectId: intentId,
    installationId: intent.installationId,
    intentId,
    initiatedBy: "user",
    data: {
      kind: intent.kind,
      approved_via: approvedVia,
    },
  });

  // For magic-link usage, default to redirecting to a minimal success page.
  // Return JSON only when the client explicitly requests JSON.
  const accept = request.headers.get("accept") ?? "";
  const wantsJson = accept.includes("application/json");
  if (approvedVia === "magic_link" && !wantsJson) {
    return NextResponse.redirect(
      new URL(`/revclaw/intents/${intentId}/approved`, request.url),
    );
  }

  return NextResponse.json({
    intent_id: intentId,
    status: "approved",
    approved_at: now.toISOString(),
    approved_via: approvedVia,
  });
}
