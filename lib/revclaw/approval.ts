/**
 * RevClaw Approval Utilities
 *
 * Provides functions to send approval requests to users via Telegram.
 */

import {
  buildInlineKeyboard,
  sendTelegramMessage,
} from "./telegram";

export interface SendApprovalButtonParams {
  botToken: string;
  chatId: string | number;
  agentName: string;
  agentId: string;
  claimId: string;
  requestedScopes: string[];
  expiresAt: Date;
  manifestPreview?: string;
}

/**
 * Send a Telegram message with an approval button for a RevClaw agent registration.
 *
 * @returns Result of the Telegram API call
 */
export async function sendApprovalButton(
  params: SendApprovalButtonParams
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const {
    botToken,
    chatId,
    agentName,
    claimId,
    requestedScopes,
    expiresAt,
    manifestPreview,
  } = params;

  // Format expiration time
  const expiresIn = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60));
  const expiresText = expiresIn > 0 ? `${expiresIn} minutes` : "soon";

  // Build the message text
  const scopesList =
    requestedScopes.length > 0
      ? requestedScopes.map((s) => `  • ${s}`).join("\n")
      : "  • (no specific scopes requested)";

  const messageLines = [
    `🤖 **${agentName}** wants to act on your behalf`,
    "",
    "**Requested permissions:**",
    scopesList,
    "",
  ];

  if (manifestPreview) {
    messageLines.push(
      "**Description:**",
      manifestPreview.slice(0, 200) + (manifestPreview.length > 200 ? "..." : ""),
      ""
    );
  }

  messageLines.push(
    `⏰ Expires in: ${expiresText}`,
    "",
    "By approving, you allow this bot to perform actions on RevShare on your behalf. You can revoke access at any time."
  );

  const messageText = messageLines.join("\n");

  // Build the inline keyboard with approve button
  // callback_data format: "rclaim:{claim_id}"
  const keyboard = buildInlineKeyboard([
    [
      {
        text: `✅ Approve ${agentName}`,
        callback_data: `rclaim:${claimId}`,
      },
    ],
    [
      {
        text: "❌ Deny",
        callback_data: `rdeny:${claimId}`,
      },
    ],
  ]);

  const result = await sendTelegramMessage(botToken, chatId, messageText, {
    replyMarkup: keyboard,
    parseMode: "Markdown",
  });

  if (!result.ok) {
    return { ok: false, error: result.description ?? "Unknown error" };
  }

  // Extract message_id from result
  const messageId =
    result.result && typeof result.result === "object" && "message_id" in result.result
      ? (result.result as { message_id: number }).message_id
      : undefined;

  return { ok: true, messageId };
}

/**
 * Send approval request for a newly registered agent.
 * This is called after successful agent registration.
 *
 * @param params Registration details
 * @returns Result of sending the approval button
 */
export async function notifyUserForApproval(params: {
  telegramChatId: string | number;
  agentName: string;
  agentId: string;
  claimId: string;
  requestedScopes: string[];
  expiresAt: Date;
  manifestPreview?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("[RevClaw] TELEGRAM_BOT_TOKEN not configured");
    return { ok: false, error: "Telegram bot not configured" };
  }

  return sendApprovalButton({
    botToken,
    chatId: params.telegramChatId,
    agentName: params.agentName,
    agentId: params.agentId,
    claimId: params.claimId,
    requestedScopes: params.requestedScopes,
    expiresAt: params.expiresAt,
    manifestPreview: params.manifestPreview,
  });
}
