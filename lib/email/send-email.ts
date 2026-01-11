import "server-only";

import type { ReactElement } from "react";

import { assertResendConfigured, getDefaultFromEmail, resend } from "@/lib/email/client";

export type SendEmailPayload = {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  text?: string;
  from?: string;
  replyTo?: string | string[];
};

export async function sendEmail(payload: SendEmailPayload) {
  assertResendConfigured();

  const { from, to, subject, react, text, replyTo } = payload;
  const resolvedFrom = from ?? getDefaultFromEmail();

  const { data, error } = await resend.emails.send({
    from: resolvedFrom,
    to,
    subject,
    react,
    text,
    replyTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
