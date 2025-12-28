import { NextResponse } from "next/server";
import { z } from "zod";

import { platformStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const connectInput = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.enum(["creator", "marketer"]).optional(),
  country: z.string().min(2).max(2).optional(),
  type: z.enum(["express", "standard"]).optional(),
  businessType: z.enum(["individual", "company"]).optional(),
  refreshUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
});

function defaultUrl(path: string) {
  return `http://localhost:3000${path}`;
}

function appendQuery(url: string, params: Record<string, string>) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return target.toString();
}

export async function POST(request: Request) {
  const parsed = connectInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const stripe = platformStripe();
  const displayName =
    payload.name?.trim() || payload.email.split("@")[0] || "New account";
  const role = payload.role ?? "creator";

  const account = await stripe.accounts.create({
    type: payload.type ?? "express",
    country: payload.country ?? "US",
    email: payload.email,
    business_type: payload.businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      role,
      name: payload.name,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      stripeConnectedAccountId: account.id,
      onboardingStatus: "pending",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const refreshUrl =
    payload.refreshUrl ??
    process.env.ACCOUNT_LINK_REFRESH_URL ??
    defaultUrl("/marketer/settings?onboarding=refresh");
  const returnUrl =
    payload.returnUrl ??
    process.env.ACCOUNT_LINK_RETURN_URL ??
    defaultUrl("/marketer/settings?onboarding=return");

  const refreshUrlWithAccount = appendQuery(refreshUrl, {
    accountId: account.id,
    onboarding: "refresh",
  });
  const returnUrlWithAccount = appendQuery(returnUrl, {
    accountId: account.id,
    onboarding: "return",
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: refreshUrlWithAccount,
    return_url: returnUrlWithAccount,
    type: "account_onboarding",
  });

  return NextResponse.json({
    data: {
      accountId: account.id,
      onboardingUrl: link.url,
      expiresAt: link.expires_at,
      user: updatedUser,
    },
  });
}
