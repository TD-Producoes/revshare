import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = new Resend(apiKey ?? "");

export function getDefaultFromEmail() {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is required to send email.");
  }

  return from;
}

export function assertResendConfigured() {
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }
}
