/**
 * RevClaw Telegram Utilities
 *
 * Provides:
 * - Signature verification for Telegram callback data
 * - Inline keyboard button generation
 * - Telegram Bot API helpers
 */

import crypto from "crypto";

// =============================================================================
// Telegram Signature Verification
// =============================================================================

/**
 * Verify Telegram callback query data signature.
 * Uses HMAC-SHA-256 with the bot token as the secret.
 *
 * Telegram signs callback data with: HMAC-SHA-256(data_check_string, secret_key)
 * where secret_key = SHA-256(bot_token)
 *
 * @see https://core.telegram.org/bots/api#validating-data-received-via-the-mini-app
 */
export function verifyTelegramCallback(
  callbackData: Record<string, string>,
  botToken: string
): boolean {
  const { hash, ...data } = callbackData;
  if (!hash) return false;

  // Sort keys and create data check string
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("\n");

  // Secret key is SHA-256 of the bot token
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Compute HMAC-SHA-256
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(hash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verify Telegram Login Widget data.
 * Similar to callback verification but used for login widget.
 */
export function verifyTelegramLoginWidget(
  authData: Record<string, string>,
  botToken: string,
  maxAgeSeconds: number = 86400 // 24 hours default
): { valid: boolean; userId?: string; error?: string } {
  const { hash, auth_date, id, ...rest } = authData;

  if (!hash || !auth_date || !id) {
    return { valid: false, error: "Missing required fields" };
  }

  // Check if the auth_date is not too old
  const authTimestamp = parseInt(auth_date, 10);
  if (isNaN(authTimestamp)) {
    return { valid: false, error: "Invalid auth_date" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - authTimestamp > maxAgeSeconds) {
    return { valid: false, error: "Auth data expired" };
  }

  // Reconstruct data for verification
  const dataToVerify = { auth_date, id, ...rest };
  const dataCheckString = Object.keys(dataToVerify)
    .sort()
    .map((key) => `${key}=${dataToVerify[key]}`)
    .join("\n");

  // Secret key is SHA-256 of the bot token
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Compute HMAC-SHA-256
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Constant-time comparison
  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(hash, "hex")
    );
    return valid ? { valid: true, userId: id } : { valid: false, error: "Invalid signature" };
  } catch {
    return { valid: false, error: "Hash comparison failed" };
  }
}

// =============================================================================
// Telegram Bot API Helpers
// =============================================================================

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineButton[][];
}

/**
 * Build an inline keyboard for Telegram messages.
 */
export function buildInlineKeyboard(
  buttons: TelegramInlineButton[][]
): TelegramInlineKeyboard {
  return { inline_keyboard: buttons };
}

/**
 * Send a message with inline keyboard via Telegram Bot API.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  options?: {
    replyMarkup?: TelegramInlineKeyboard;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    disableNotification?: boolean;
  }
): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };

  if (options?.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }
  if (options?.parseMode) {
    body.parse_mode = options.parseMode;
  }
  if (options?.disableNotification !== undefined) {
    body.disable_notification = options.disableNotification;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return (await response.json()) as { ok: boolean; result?: unknown; description?: string };
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Answer a callback query (acknowledge button press).
 */
export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  options?: {
    text?: string;
    showAlert?: boolean;
  }
): Promise<{ ok: boolean; description?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;

  const body: Record<string, unknown> = {
    callback_query_id: callbackQueryId,
  };

  if (options?.text) {
    body.text = options.text;
  }
  if (options?.showAlert !== undefined) {
    body.show_alert = options.showAlert;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return (await response.json()) as { ok: boolean; description?: string };
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Edit a message text (used after approval to show confirmation).
 */
export async function editMessageText(
  botToken: string,
  chatId: string | number,
  messageId: number,
  text: string,
  options?: {
    replyMarkup?: TelegramInlineKeyboard;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  }
): Promise<{ ok: boolean; description?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
  };

  if (options?.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }
  if (options?.parseMode) {
    body.parse_mode = options.parseMode;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return (await response.json()) as { ok: boolean; description?: string };
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Callback Data Encoding
// =============================================================================

/**
 * Encode claim approval data for callback_data (max 64 bytes).
 * Format: "rclaim:{agent_id_prefix}:{claim_id_prefix}"
 */
export function encodeClaimCallbackData(agentId: string, claimId: string): string {
  // Telegram limits callback_data to 64 bytes
  // Use prefix of IDs to fit within limit
  const prefix = "rclaim";
  const agentPrefix = agentId.slice(0, 12);
  const claimPrefix = claimId.slice(0, 20);
  return `${prefix}:${agentPrefix}:${claimPrefix}`;
}

/**
 * Decode claim approval callback data.
 */
export function decodeClaimCallbackData(
  data: string
): { agentIdPrefix: string; claimIdPrefix: string } | null {
  if (!data.startsWith("rclaim:")) return null;
  const parts = data.split(":");
  if (parts.length !== 3) return null;
  return {
    agentIdPrefix: parts[1],
    claimIdPrefix: parts[2],
  };
}
