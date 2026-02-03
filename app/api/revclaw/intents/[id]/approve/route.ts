import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuthUser, authErrorResponse, AuthError } from "@/lib/auth";
import { createAuditLog } from "@/lib/revclaw/intent-auth";

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

  // Authenticate human user
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
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

  // Verify user owns the installation
  if (intent.installation.userId !== authUser.id) {
    return NextResponse.json(
      { error: "You do not own this installation", code: "forbidden" },
      { status: 403 }
    );
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
    },
  });

  // Create audit log
  await createAuditLog({
    agentId: intent.agentId,
    userId: authUser.id,
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
      approved_by_user_id: authUser.id,
      agent_name: intent.installation.agent.name,
    },
  });

  return NextResponse.json({
    intent_id: intentId,
    status: "approved",
    approved_at: now.toISOString(),
  });
}
