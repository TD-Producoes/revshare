import { NextResponse } from "next/server";
import { EventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { buildInlineKeyboard, sendTelegramMessage } from "@/lib/revclaw/telegram";

const DEFAULT_REDIRECT_URI = `${process.env.BASE_URL}/api/connect/oauth/callback`;

function buildStripeConnectUrl(projectId: string) {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    throw new Error("STRIPE_CONNECT_CLIENT_ID is required");
  }

  const redirectUri = process.env.STRIPE_CONNECT_REDIRECT_URI ?? DEFAULT_REDIRECT_URI;

  // Match the founder project page flow: role=founder, state={role, projectId}
  const state = Buffer.from(
    JSON.stringify({ role: "founder", projectId }),
    "utf8",
  ).toString("base64");

  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
}

/**
 * RevClaw wrapper: create a Stripe Connect OAuth link for a project and ping the human on Telegram.
 *
 * Mirrors the same flow used by the founder project page:
 * - GET /api/connect/oauth/authorize?projectId=... (role=founder)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "stripe:connect_link");

    const { id: projectId } = await context.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = buildStripeConnectUrl(projectId);

    // Best-effort Telegram prompt.
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const user = await prisma.user.findUnique({
      where: { id: agent.userId },
      select: { telegramUserId: true },
    });

    let telegramSent = false;
    let telegramError: string | null = null;

    if (telegramBotToken && user?.telegramUserId) {
      const kb = buildInlineKeyboard([
        [{ text: "Connect Stripe", url }],
        [{ text: "I connected Stripe ✅", callback_data: `revclaw:stripe_connected:${projectId}` }],
      ]);

      const msg = await sendTelegramMessage(
        telegramBotToken,
        user.telegramUserId,
        `Stripe connection needed for **${project.name}**.\n\nTap below to connect Stripe (founder flow).`,
        { replyMarkup: kb, parseMode: "Markdown" },
      );

      telegramSent = Boolean(msg.ok);
      if (!msg.ok) telegramError = msg.description ?? "Unknown Telegram error";
    }

    await emitRevclawEvent({
      type: EventType.PROJECT_UPDATED,
      agentId: agent.agentId,
      userId: agent.userId,
      projectId: project.id,
      subjectType: "Project",
      subjectId: project.id,
      installationId: agent.installationId,
      initiatedBy: "agent",
      data: {
        action: "stripe_connect_link_created",
        telegramSent,
      },
    });

    return NextResponse.json(
      {
        data: {
          url,
          telegram: telegramBotToken && user?.telegramUserId ? { sent: telegramSent, error: telegramError } : { sent: false, error: "TELEGRAM_BOT_TOKEN or telegram_user_id missing" },
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
