import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuthUser, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/revclaw/intent-auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { hashToken } from "@/lib/revclaw/crypto";

/**
 * POST /api/revclaw/intents/:id/deny
 *
 * Human denial of an action intent.
 *
 * Authentication: Session-based (human user)
 *
 * Flow:
 * 1. Verify user is authenticated
 * 2. Verify user owns the installation
 * 3. Check intent is PENDING_APPROVAL and not expired
 * 4. Set status to DENIED
 * 5. Log denial (audit trail)
 *
 * Output: { intent_id, status: "denied" }
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

const denyInput = z.object({
  reason: z.string().max(500).optional(),
}).optional();

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: intentId } = await params;

  // Magic-link mode (no session): accept token via query ?token=...
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  let authUser: { id: string } | null = null;
  let deniedVia: "session" | "magic_link" = "session";

  if (!token) {
    // Session-based denial
    try {
      authUser = await requireAuthUser();
    } catch (error) {
      return authErrorResponse(error);
    }
  } else {
    deniedVia = "magic_link";
  }

  // Parse optional input
  const body = await request.json().catch(() => ({}));
  const parsed = denyInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const reason = parsed.data?.reason;

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

  // Verify denial authorization
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

  // Check intent status - can deny pending or approved (but not executed)
  if (intent.status === "EXECUTED") {
    return NextResponse.json(
      { error: "Cannot deny an already executed intent", code: "intent_already_executed" },
      { status: 409 }
    );
  }

  if (intent.status === "DENIED") {
    return NextResponse.json(
      { error: "Intent is already denied", code: "intent_already_denied" },
      { status: 409 }
    );
  }

  if (intent.status === "EXPIRED") {
    return NextResponse.json(
      { error: "Intent has already expired", code: "intent_expired" },
      { status: 410 }
    );
  }

  // Deny the intent
  const now = new Date();
  await prisma.revclawIntent.update({
    where: { id: intentId },
    data: {
      status: "DENIED",
      deniedAt: now,
      denyReason: reason,
      approvalTokenUsedAt: token ? now : intent.approvalTokenUsedAt,
    },
  });

  // Create audit log
  await createAuditLog({
    agentId: intent.agentId,
    userId: intent.installation.userId,
    action: "intent.denied",
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
      denied_via: deniedVia,
      agent_name: intent.installation.agent.name,
      reason: reason ?? null,
    },
  });

  await emitRevclawEvent({
    type: "REVCLAW_INTENT_DENIED",
    agentId: intent.agentId,
    userId: intent.installation.userId,
    subjectType: "RevclawIntent",
    subjectId: intentId,
    installationId: intent.installationId,
    intentId,
    initiatedBy: "user",
    data: {
      kind: intent.kind,
      denied_via: deniedVia,
      reason: reason ?? null,
    },
  });

  const accept = request.headers.get("accept") ?? "";
  const wantsJson = accept.includes("application/json");
  if (deniedVia === "magic_link" && !wantsJson) {
    return NextResponse.redirect(new URL(`/revclaw/intents/${intentId}/denied`, request.url));
  }

  return NextResponse.json({
    intent_id: intentId,
    status: "denied",
    denied_at: now.toISOString(),
    denied_via: deniedVia,
    reason: reason ?? null,
  });
}
