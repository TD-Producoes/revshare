import { NextResponse } from "next/server";
import { z } from "zod";

import { platformStripe } from "@/lib/stripe";

const loginInput = z.object({
  accountId: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = loginInput.safeParse({
    accountId: searchParams.get("accountId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 },
    );
  }

  const stripe = platformStripe();
  const link = await stripe.accounts.createLoginLink(parsed.data.accountId);

  return NextResponse.json({
    data: {
      url: link.url,
      expiresAt: link.expires_at,
    },
  });
}
