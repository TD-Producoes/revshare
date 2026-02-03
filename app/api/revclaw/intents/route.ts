import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  hashPayload,
  generateSecureToken,
} from "@/lib/revclaw/crypto";
import {
  authenticateBot,
  botAuthErrorResponse,
  createAuditLog,
  type IntentKind,
} from "@/lib/revclaw/intent-auth";
import { sendTelegramMessage, buildInlineKeyboard } from "@/lib/revclaw/telegram";
import { emitRevclawEvent } from "@/lib/revclaw/events";

/**
 * POST /api/revclaw/intents
 *
 * Create a new action intent for approval.
 *
 * Authentication: Bot bearer token (agent_secret)
 * Required headers:
 *   - Authorization: Bearer <agent_secret>
 *   - X-RevClaw-User-Id: <user_id>
 *
 * Input: { kind, payload_json, idempotency_key? }
 * Output: { intent_id, status, approval_url?, expires_at }
 *
 * Security:
 * - Payload becomes IMMUTABLE after creation
 * - Hash-based integrity verification
 * - Idempotency key prevents duplicate intents
 */

const INTENT_EXPIRY_MINUTES = 60; // Intents expire after 1 hour

const intentKinds = ["PROJECT_PUBLISH", "APPLICATION_SUBMIT"] as const;

const createIntentInput = z.object({
  kind: z.enum(intentKinds),
  payload_json: z.record(z.string(), z.unknown()),
  idempotency_key: z.string().min(1).max(100).optional(),
});

/**
 * Check if the installation policy requires approval for this action kind.
 */
function requiresApproval(
  kind: IntentKind,
  policy: {
    requireApprovalForPublish: boolean;
    requireApprovalForApply: boolean;
  }
): boolean {
  switch (kind) {
    case "PROJECT_PUBLISH":
      return policy.requireApprovalForPublish;
    case "APPLICATION_SUBMIT":
      return policy.requireApprovalForApply;
    default:
      return true; // Default to requiring approval for unknown kinds
  }
}

/**
 * Format intent kind for human display.
 */
function formatIntentKind(kind: IntentKind): string {
  switch (kind) {
    case "PROJECT_PUBLISH":
      return "publish a project";
    case "APPLICATION_SUBMIT":
      return "submit an application";
    default: {
      // Fallback for any future kinds
      const kindStr = kind as string;
      return kindStr.toLowerCase().replace(/_/g, " ");
    }
  }
}

/**
 * Send approval notification to user via Telegram.
 */
async function sendIntentApprovalNotification(params: {
  userId: string;
  intentId: string;
  agentName: string;
  kind: IntentKind;
  payloadPreview: string;
  expiresAt: Date;
}): Promise<{ sent: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("[RevClaw] TELEGRAM_BOT_TOKEN not configured");
    return { sent: false, error: "Bot not configured" };
  }

  // Get user's Telegram ID
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { telegramUserId: true },
  });

  if (!user?.telegramUserId) {
    return { sent: false, error: "User has no Telegram ID" };
  }

  const expiresIn = Math.max(
    0,
    Math.floor((params.expiresAt.getTime() - Date.now()) / 1000 / 60)
  );

  const messageLines = [
    `🤖 **${params.agentName}** wants to ${formatIntentKind(params.kind)}`,
    "",
    "**Action details:**",
    params.payloadPreview.slice(0, 300) + (params.payloadPreview.length > 300 ? "..." : ""),
    "",
    `⏰ Expires in: ${expiresIn} minutes`,
    "",
    "Review and approve or deny this action:",
  ];

  const keyboard = buildInlineKeyboard([
    [
      { text: "✅ Approve", callback_data: `rintent_approve:${params.intentId}` },
      { text: "❌ Deny", callback_data: `rintent_deny:${params.intentId}` },
    ],
  ]);

  const result = await sendTelegramMessage(
    botToken,
    user.telegramUserId,
    messageLines.join("\n"),
    { replyMarkup: keyboard, parseMode: "Markdown" }
  );

  if (!result.ok) {
    return { sent: false, error: result.description ?? "Unknown error" };
  }

  return { sent: true };
}

/**
 * Generate a preview of the payload for human review.
 */
function generatePayloadPreview(kind: IntentKind, payload: Record<string, unknown>): string {
  switch (kind) {
    case "PROJECT_PUBLISH": {
      const projectId = payload.project_id ?? payload.projectId ?? "unknown";
      const projectName = payload.project_name ?? payload.projectName ?? payload.name ?? "";
      return projectName
        ? `Project: "${projectName}" (${projectId})`
        : `Project ID: ${projectId}`;
    }
    case "APPLICATION_SUBMIT": {
      const projectId = payload.project_id ?? payload.projectId ?? "unknown";
      const projectName = payload.project_name ?? payload.projectName ?? "";
      const message = payload.message ?? "";
      let preview = projectName
        ? `Apply to: "${projectName}" (${projectId})`
        : `Project ID: ${projectId}`;
      if (message) {
        preview += `\nMessage: "${String(message).slice(0, 100)}${String(message).length > 100 ? "..." : ""}"`;
      }
      return preview;
    }
    default:
      return JSON.stringify(payload, null, 2).slice(0, 300);
  }
}

export async function POST(request: NextRequest) {
  // Authenticate the bot
  const authResult = await authenticateBot(request);
  if (!authResult.success) {
    return botAuthErrorResponse(authResult);
  }

  const { context } = authResult;

  // Parse input
  const body = await request.json().catch(() => null);
  const parsed = createIntentInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten(), code: "invalid_payload" },
      { status: 400 }
    );
  }

  const { kind, payload_json, idempotency_key } = parsed.data;

  // Generate or use provided idempotency key
  const idempotencyKey = idempotency_key ?? `auto_${Date.now()}_${generateSecureToken(8)}`;

  // Check for existing intent with same idempotency key
  const existingIntent = await prisma.revclawIntent.findUnique({
    where: {
      idempotencyKey_installationId: {
        idempotencyKey,
        installationId: context.installationId,
      },
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      payloadHash: true,
    },
  });

  if (existingIntent) {
    // Return cached result (idempotency)
    const approvalUrl = existingIntent.status === "PENDING_APPROVAL"
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/revclaw/intents/${existingIntent.id}/approve`
      : undefined;

    return NextResponse.json({
      intent_id: existingIntent.id,
      status: existingIntent.status.toLowerCase(),
      approval_url: approvalUrl,
      expires_at: existingIntent.expiresAt.toISOString(),
      idempotent: true,
    });
  }

  // Compute payload hash for integrity verification
  const payloadHash = hashPayload(payload_json);

  // Check if approval is required per installation policy
  const needsApproval = requiresApproval(kind, context.installation);

  // Calculate expiration
  const expiresAt = new Date(Date.now() + INTENT_EXPIRY_MINUTES * 60 * 1000);

  // Create the intent
  const intent = await prisma.revclawIntent.create({
    data: {
      installationId: context.installationId,
      agentId: context.agentId,
      onBehalfOfUserId: context.userId,
      kind,
      payloadJson: payload_json as object,
      payloadHash,
      idempotencyKey,
      status: needsApproval ? "PENDING_APPROVAL" : "APPROVED",
      approvedAt: needsApproval ? null : new Date(),
      approvedPayloadHash: needsApproval ? null : payloadHash,
      expiresAt,
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
    },
  });

  // Create audit log
  await createAuditLog({
    agentId: context.agentId,
    userId: context.userId,
    action: "intent.created",
    resourceType: "RevclawIntent",
    resourceId: intent.id,
    idempotencyKey,
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
    payload: {
      kind,
      payload_hash: payloadHash,
      needs_approval: needsApproval,
      auto_approved: !needsApproval,
    },
  });

  const projectIdFromPayload =
    typeof payload_json.project_id === "string"
      ? payload_json.project_id
      : typeof payload_json.projectId === "string"
        ? payload_json.projectId
        : null;

  await emitRevclawEvent({
    type: "REVCLAW_INTENT_CREATED",
    agentId: context.agentId,
    userId: context.userId,
    projectId: projectIdFromPayload,
    subjectType: "RevclawIntent",
    subjectId: intent.id,
    installationId: context.installationId,
    intentId: intent.id,
    initiatedBy: "agent",
    data: {
      kind,
      needs_approval: needsApproval,
    },
  });

  // Send approval notification if needed
  let approvalUrl: string | undefined;
  if (needsApproval) {
    approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/revclaw/intents/${intent.id}/approve`;

    const payloadPreview = generatePayloadPreview(kind, payload_json);
    const notifyResult = await sendIntentApprovalNotification({
      userId: context.userId,
      intentId: intent.id,
      agentName: context.agentName,
      kind,
      payloadPreview,
      expiresAt,
    });

    if (!notifyResult.sent) {
      console.warn(
        `[RevClaw] Failed to send approval notification: ${notifyResult.error}`
      );
      // Don't fail the request - user can still approve via web
    }
  }

  return NextResponse.json(
    {
      intent_id: intent.id,
      status: intent.status.toLowerCase(),
      approval_url: approvalUrl,
      expires_at: intent.expiresAt.toISOString(),
    },
    { status: 201 }
  );
}

/**
 * GET /api/revclaw/intents
 *
 * List intents for the authenticated bot's installation.
 */
export async function GET(request: NextRequest) {
  // Authenticate the bot
  const authResult = await authenticateBot(request);
  if (!authResult.success) {
    return botAuthErrorResponse(authResult);
  }

  const { context } = authResult;
  const { searchParams } = new URL(request.url);

  // Parse query params
  const status = searchParams.get("status");
  const kind = searchParams.get("kind");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  // Build filter
  const where: Record<string, unknown> = {
    installationId: context.installationId,
  };
  if (status) {
    where.status = status.toUpperCase();
  }
  if (kind) {
    where.kind = kind.toUpperCase();
  }

  const intents = await prisma.revclawIntent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      kind: true,
      status: true,
      payloadHash: true,
      expiresAt: true,
      approvedAt: true,
      deniedAt: true,
      executedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: intents.map((i) => ({
      intent_id: i.id,
      kind: i.kind.toLowerCase(),
      status: i.status.toLowerCase(),
      payload_hash: i.payloadHash,
      expires_at: i.expiresAt.toISOString(),
      approved_at: i.approvedAt?.toISOString() ?? null,
      denied_at: i.deniedAt?.toISOString() ?? null,
      executed_at: i.executedAt?.toISOString() ?? null,
      created_at: i.createdAt.toISOString(),
    })),
  });
}
