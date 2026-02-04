import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { processClaimInternal } from "@/app/api/revclaw/agents/claim/route";
import {
  answerCallbackQuery,
  editMessageText,
} from "@/lib/revclaw/telegram";
import { createAuditLog } from "@/lib/revclaw/intent-auth";

/**
 * POST /api/revclaw/telegram/callback
 *
 * Handles Telegram Bot API webhook callbacks for RevClaw approval buttons.
 * This is the secure entry point for claim approvals AND intent approvals.
 *
 * SECURITY:
 * - Verifies Telegram signature to ensure callback is authentic
 * - Extracts telegram_user_id from verified callback data
 * - Never trusts user-provided telegram_user_id
 */

// Telegram Update types (minimal subset for our needs)
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
  };
  from?: TelegramUser;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
}

/**
 * Verify Telegram webhook request using the secret token.
 * Telegram sends X-Telegram-Bot-Api-Secret-Token header if configured.
 */
function verifyTelegramWebhook(
  secretToken: string | null,
  expectedToken: string | undefined
): boolean {
  if (!expectedToken) {
    // If no expected token configured, skip verification (not recommended for production)
    console.warn("[RevClaw] No TELEGRAM_WEBHOOK_SECRET configured");
    return true;
  }
  if (!secretToken) {
    return false;
  }
  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(secretToken),
      Buffer.from(expectedToken)
    );
  } catch {
    return false;
  }
}

/**
 * Parse callback_data to extract claim information.
 * Format: "rclaim:{full_claim_id}" or "rdeny:{full_claim_id}"
 */
function parseClaimCallback(
  data: string
): { claimId: string; action: "approve" | "deny" } | null {
  if (data.startsWith("rclaim:")) {
    const claimId = data.slice(7);
    if (!claimId) return null;
    return { claimId, action: "approve" };
  }
  if (data.startsWith("rdeny:")) {
    const claimId = data.slice(6);
    if (!claimId) return null;
    return { claimId, action: "deny" };
  }
  return null;
}

/**
 * Parse callback_data to extract intent information.
 * Format: "rintent_approve:{intent_id}" or "rintent_deny:{intent_id}"
 */
function parseIntentCallback(
  data: string
): { intentId: string; action: "approve" | "deny" } | null {
  if (data.startsWith("rintent_approve:")) {
    const intentId = data.slice(16);
    if (!intentId) return null;
    return { intentId, action: "approve" };
  }
  if (data.startsWith("rintent_deny:")) {
    const intentId = data.slice(13);
    if (!intentId) return null;
    return { intentId, action: "deny" };
  }
  return null;
}

/**
 * Handle intent approval/denial from Telegram callback.
 */
async function handleIntentCallback(
  botToken: string,
  callbackQuery: TelegramCallbackQuery,
  intentId: string,
  action: "approve" | "deny",
  telegramUserId: string,
  telegramUsername: string | undefined,
  telegramName: string
): Promise<void> {
  // Find the intent with installation details
  const intent = await prisma.revclawIntent.findUnique({
    where: { id: intentId },
    include: {
      installation: {
        select: {
          id: true,
          userId: true,
          user: {
            select: { telegramUserId: true },
          },
          agent: { select: { name: true } },
        },
      },
    },
  });

  if (!intent) {
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: "❌ Intent not found or expired",
      showAlert: true,
    });
    return;
  }

  // Verify the telegram user owns the installation
  if (intent.installation.user.telegramUserId !== telegramUserId) {
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: "❌ You are not authorized to approve this intent",
      showAlert: true,
    });
    return;
  }

  const agentName = intent.installation.agent.name;

  // Handle deny
  if (action === "deny") {
    if (intent.status === "EXECUTED") {
      await answerCallbackQuery(botToken, callbackQuery.id, {
        text: "❌ Intent has already been executed",
        showAlert: true,
      });
      return;
    }

    if (intent.status === "DENIED") {
      await answerCallbackQuery(botToken, callbackQuery.id, {
        text: "Intent was already denied",
      });
      return;
    }

    await prisma.revclawIntent.update({
      where: { id: intentId },
      data: {
        status: "DENIED",
        deniedAt: new Date(),
        denyReason: "Denied via Telegram",
      },
    });

    await createAuditLog({
      agentId: intent.agentId,
      userId: intent.installation.userId,
      action: "intent.denied",
      resourceType: "RevclawIntent",
      resourceId: intentId,
      payload: {
        kind: intent.kind,
        denied_via: "telegram",
        denied_by_telegram_id: telegramUserId,
      },
    });

    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: `❌ ${agentName}'s action denied`,
    });

    if (callbackQuery.message) {
      await editMessageText(
        botToken,
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        [
          `❌ **Action denied**`,
          "",
          `Agent: ${agentName}`,
          `Action: ${intent.kind.toLowerCase().replace(/_/g, " ")}`,
          `Denied by: ${telegramUsername ? `@${telegramUsername}` : telegramName}`,
        ].join("\n"),
        { parseMode: "Markdown" }
      );
    }
    return;
  }

  // Handle approve
  if (intent.status !== "PENDING_APPROVAL") {
    const statusMessages: Record<string, string> = {
      APPROVED: "Intent is already approved",
      DENIED: "Intent was denied",
      EXECUTED: "Intent has already been executed",
      EXPIRED: "Intent has expired",
    };
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: statusMessages[intent.status] ?? `Invalid status: ${intent.status}`,
      showAlert: true,
    });
    return;
  }

  if (intent.expiresAt < new Date()) {
    await prisma.revclawIntent.update({
      where: { id: intentId },
      data: { status: "EXPIRED" },
    });
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: "❌ Intent has expired",
      showAlert: true,
    });
    return;
  }

  await prisma.revclawIntent.update({
    where: { id: intentId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedPayloadHash: intent.payloadHash,
    },
  });

  await createAuditLog({
    agentId: intent.agentId,
    userId: intent.installation.userId,
    action: "intent.approved",
    resourceType: "RevclawIntent",
    resourceId: intentId,
    payload: {
      kind: intent.kind,
      approved_via: "telegram",
      approved_by_telegram_id: telegramUserId,
    },
  });

  await answerCallbackQuery(botToken, callbackQuery.id, {
    text: `✅ ${agentName}'s action approved!`,
  });

  if (callbackQuery.message) {
    await editMessageText(
      botToken,
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      [
        `✅ **Action approved**`,
        "",
        `Agent: ${agentName}`,
        `Action: ${intent.kind.toLowerCase().replace(/_/g, " ")}`,
        `Approved by: ${telegramUsername ? `@${telegramUsername}` : telegramName}`,
        "",
        "The agent can now execute this action.",
      ].join("\n"),
      { parseMode: "Markdown" }
    );
  }
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken) {
    console.error("[RevClaw] TELEGRAM_BOT_TOKEN not configured");
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  // Verify webhook secret if configured
  const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!verifyTelegramWebhook(secretHeader, webhookSecret)) {
    console.warn("[RevClaw] Invalid webhook secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse the update
  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // We only handle callback queries (button presses)
  const callbackQuery = update.callback_query;
  if (!callbackQuery) {
    // Not a callback query, ignore (could be a message, etc.)
    return NextResponse.json({ ok: true });
  }

  const callbackData = callbackQuery.data;
  if (!callbackData) {
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: "Invalid button data",
      showAlert: true,
    });
    return NextResponse.json({ ok: true });
  }

  // Try to parse as intent callback first
  const intentParsed = parseIntentCallback(callbackData);
  if (intentParsed) {
    const telegramUserId = callbackQuery.from.id.toString();
    const telegramUsername = callbackQuery.from.username;
    const telegramName =
      `${callbackQuery.from.first_name}${callbackQuery.from.last_name ? ` ${callbackQuery.from.last_name}` : ""}`.trim();

    await handleIntentCallback(
      botToken,
      callbackQuery,
      intentParsed.intentId,
      intentParsed.action,
      telegramUserId,
      telegramUsername,
      telegramName
    );
    return NextResponse.json({ ok: true });
  }

  // Parse the callback data as claim callback
  const parsed = parseClaimCallback(callbackData);
  if (!parsed) {
    // Not a RevClaw callback, ignore
    await answerCallbackQuery(botToken, callbackQuery.id);
    return NextResponse.json({ ok: true });
  }

  // Extract telegram_user_id from the verified callback
  // This is the SECURE way to get the user ID - it comes from Telegram's signed update
  const telegramUserId = callbackQuery.from.id.toString();
  const telegramUsername = callbackQuery.from.username;
  const telegramName =
    `${callbackQuery.from.first_name}${callbackQuery.from.last_name ? ` ${callbackQuery.from.last_name}` : ""}`.trim();

  // Find the registration by claim_id
  const registration = await prisma.revclawRegistration.findUnique({
    where: { claimId: parsed.claimId },
    select: {
      id: true,
      agentId: true,
      status: true,
      expiresAt: true,
      agent: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!registration) {
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: "❌ Invalid or expired approval link",
      showAlert: true,
    });
    return NextResponse.json({ ok: true });
  }

  // Handle deny action
  if (parsed.action === "deny") {
    // Mark registration as revoked
    if (registration.status === "PENDING") {
      await prisma.revclawRegistration.update({
        where: { id: registration.id },
        data: { status: "REVOKED" },
      });
    }

    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: `❌ ${registration.agent.name} denied`,
    });

    if (callbackQuery.message) {
      const denyText = [
        `❌ **${registration.agent.name}** denied`,
        "",
        `Denied by: ${telegramUsername ? `@${telegramUsername}` : telegramName}`,
        "",
        "The bot will not be able to act on your behalf.",
      ].join("\n");

      await editMessageText(
        botToken,
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        denyText,
        { parseMode: "Markdown" }
      );
    }

    return NextResponse.json({ ok: true });
  }

  // Process the approval claim with verified telegram_user_id
  const result = await processClaimInternal({
    agentId: registration.agentId,
    claimId: parsed.claimId,
    telegramUserId,
  });

  // Acknowledge the callback
  if (result.success) {
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: `✅ ${registration.agent.name} approved!`,
    });

    // Edit the original message to show approval confirmation
    if (callbackQuery.message) {
      const approvalText = [
        `✅ **${registration.agent.name}** approved!`,
        "",
        `Approved by: ${telegramUsername ? `@${telegramUsername}` : telegramName}`,
        `Installation ID: \`${result.installationId}\``,
        "",
        "The bot can now act on your behalf according to the granted permissions.",
      ].join("\n");

      await editMessageText(
        botToken,
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        approvalText,
        { parseMode: "Markdown" }
      );
    }
  } else {
    await answerCallbackQuery(botToken, callbackQuery.id, {
      text: `❌ ${result.error}`,
      showAlert: true,
    });

    // Optionally update the message with error
    if (callbackQuery.message && result.status === 410) {
      // Expired
      await editMessageText(
        botToken,
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        `⏰ This approval request has expired.\n\nPlease ask the bot to register again.`,
        { parseMode: "Markdown" }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
