import { NextResponse } from "next/server";
import { z } from "zod";

import { platformStripe } from "@/lib/stripe";

const onboardingInput = z.object({
  accountId: z.string().min(1),
  refreshUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
});

function defaultUrl(path: string) {
  return `${process.env.BASE_URL}${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = onboardingInput.safeParse({
    accountId: searchParams.get("accountId"),
    refreshUrl: searchParams.get("refreshUrl") ?? undefined,
    returnUrl: searchParams.get("returnUrl") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const stripe = platformStripe();
  const refreshUrl =
    parsed.data.refreshUrl ??
    process.env.ACCOUNT_LINK_REFRESH_URL ??
    defaultUrl("/?onboarding=refresh");
  const returnUrl =
    parsed.data.returnUrl ??
    process.env.ACCOUNT_LINK_RETURN_URL ??
    defaultUrl("/?onboarding=return");

  const link = await stripe.accountLinks.create({
    account: parsed.data.accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return NextResponse.json({
    data: {
      url: link.url,
      expiresAt: link.expires_at,
    },
  });
}
