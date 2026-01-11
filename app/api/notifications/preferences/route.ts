import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const querySchema = z.object({
  userId: z.string().min(1),
});

const updateSchema = z.object({
  userId: z.string().min(1),
  emailEnabled: z.boolean().optional(),
  webhookEnabled: z.boolean().optional(),
  webhookUrl: z.string().url().nullable().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, userId);
  } catch (error) {
    return authErrorResponse(error);
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return NextResponse.json({
      data: {
        userId,
        emailEnabled: false,
        webhookEnabled: false,
        webhookUrl: null,
      },
    });
  }

  return NextResponse.json({ data: preference });
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, emailEnabled, webhookEnabled, webhookUrl } = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, userId);
  } catch (error) {
    return authErrorResponse(error);
  }
  const normalizedWebhookUrl =
    typeof webhookUrl === "string" && webhookUrl.trim().length > 0
      ? webhookUrl.trim()
      : null;

  if (webhookEnabled && !normalizedWebhookUrl) {
    return NextResponse.json(
      { error: "Webhook URL is required when webhook delivery is enabled." },
      { status: 400 },
    );
  }

  const preference = await prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      emailEnabled: emailEnabled ?? false,
      webhookEnabled: webhookEnabled ?? false,
      webhookUrl: normalizedWebhookUrl,
    },
    update: {
      ...(emailEnabled !== undefined ? { emailEnabled } : {}),
      ...(webhookEnabled !== undefined ? { webhookEnabled } : {}),
      ...(webhookUrl !== undefined ? { webhookUrl: normalizedWebhookUrl } : {}),
    },
  });

  return NextResponse.json({ data: preference });
}
