import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { processClaimInternal } from "@/app/api/revclaw/agents/claim/route";
import {
  answerCallbackQuery,
  editMessageText,
} from "@/lib/revclaw/telegram";

/**
 * POST /api/revclaw/telegram/callback
 *
 * Handles Telegram Bot API webhook callbacks for RevClaw approval buttons.
 * This is the secure entry point for claim approvals.
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

  // Parse the callback data
  const parsed = parseClaimCallback(callbackData);
  if (!parsed) {
    // Not a RevClaw claim callback, ignore
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
