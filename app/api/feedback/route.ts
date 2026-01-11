import { NextResponse } from "next/server";
import { z } from "zod";
import * as React from "react";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send-email";
import FeedbackThanksEmail from "@/emails/FeedbackThanksEmail";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: authUser.id,
      message: parsed.data.message,
    },
  });

  const canSendEmail = Boolean(
    process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL,
  );

  if (authUser.email && canSendEmail) {
    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/founder`;

    await sendEmail({
      to: authUser.email,
      subject: "Thanks for your feedback",
      react: React.createElement(FeedbackThanksEmail, {
        name: authUser.user_metadata?.name,
        message: parsed.data.message,
        dashboardUrl,
      }),
      text: `Thanks for your feedback. You can keep an eye on updates here: ${dashboardUrl}`,
    });
  }

  return NextResponse.json({ data: feedback });
}
