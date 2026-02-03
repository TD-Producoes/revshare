import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  authenticateBot,
  botAuthErrorResponse,
} from "@/lib/revclaw/intent-auth";

/**
 * GET /api/revclaw/intents/:id
 *
 * Get the status of a specific intent.
 *
 * Authentication: Bot bearer token (agent_secret)
 * Required headers:
 *   - Authorization: Bearer <agent_secret>
 *   - X-RevClaw-User-Id: <user_id>
 *
 * Output: { intent_id, status, kind, payload_hash, expires_at, ... }
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: intentId } = await params;

  // Authenticate the bot
  const authResult = await authenticateBot(request);
  if (!authResult.success) {
    return botAuthErrorResponse(authResult);
  }

  const { context } = authResult;

  // Find the intent
  const intent = await prisma.revclawIntent.findUnique({
    where: { id: intentId },
    select: {
      id: true,
      installationId: true,
      kind: true,
      payloadJson: true,
      payloadHash: true,
      status: true,
      approvedAt: true,
      deniedAt: true,
      denyReason: true,
      executedAt: true,
      executionResult: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!intent) {
    return NextResponse.json(
      { error: "Intent not found", code: "intent_not_found" },
      { status: 404 }
    );
  }

  // Verify the intent belongs to this installation
  if (intent.installationId !== context.installationId) {
    return NextResponse.json(
      { error: "Intent does not belong to this installation", code: "forbidden" },
      { status: 403 }
    );
  }

  // Check if expired and update status if needed
  if (intent.status === "PENDING_APPROVAL" && intent.expiresAt < new Date()) {
    await prisma.revclawIntent.update({
      where: { id: intentId },
      data: { status: "EXPIRED" },
    });
    intent.status = "EXPIRED";
  }

  return NextResponse.json({
    intent_id: intent.id,
    kind: intent.kind.toLowerCase(),
    status: intent.status.toLowerCase(),
    payload_json: intent.payloadJson,
    payload_hash: intent.payloadHash,
    expires_at: intent.expiresAt.toISOString(),
    approved_at: intent.approvedAt?.toISOString() ?? null,
    denied_at: intent.deniedAt?.toISOString() ?? null,
    deny_reason: intent.denyReason ?? null,
    executed_at: intent.executedAt?.toISOString() ?? null,
    execution_result: intent.executionResult,
    created_at: intent.createdAt.toISOString(),
  });
}
