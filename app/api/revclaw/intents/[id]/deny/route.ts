import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuthUser, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/revclaw/intent-auth";

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

  // Authenticate human user
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
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

  // Verify user owns the installation
  if (intent.installation.userId !== authUser.id) {
    return NextResponse.json(
      { error: "You do not own this installation", code: "forbidden" },
      { status: 403 }
    );
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
    },
  });

  // Create audit log
  await createAuditLog({
    agentId: intent.agentId,
    userId: authUser.id,
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
      denied_by_user_id: authUser.id,
      agent_name: intent.installation.agent.name,
      reason: reason ?? null,
    },
  });

  return NextResponse.json({
    intent_id: intentId,
    status: "denied",
    denied_at: now.toISOString(),
    reason: reason ?? null,
  });
}
