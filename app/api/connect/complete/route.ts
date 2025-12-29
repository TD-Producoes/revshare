import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const completeInput = z.object({
  accountId: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = completeInput.safeParse({
    accountId: searchParams.get("accountId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  const stripe = platformStripe();
  const account = await stripe.accounts.retrieve(parsed.data.accountId);

  const onboardingStatus =
    account.details_submitted && account.charges_enabled
      ? "complete"
      : "pending";

  // Serialize to plain JSON to ensure compatibility with Prisma's Json type
  const onboardingData = JSON.parse(
    JSON.stringify({
      id: account.id,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      capabilities: account.capabilities,
      requirements: account.requirements,
    })
  );

  const completedAt = onboardingStatus === "complete" ? new Date() : null;

  let updated = await prisma.user.updateMany({
    where: { stripeConnectedAccountId: account.id },
    data: {
      onboardingStatus,
      onboardingData,
      onboardingCompletedAt: completedAt,
    },
  });

  if (updated.count === 0 && account.email) {
    updated = await prisma.user.updateMany({
      where: { email: account.email, stripeConnectedAccountId: null },
      data: {
        stripeConnectedAccountId: account.id,
        onboardingStatus,
        onboardingData,
        onboardingCompletedAt: completedAt,
      },
    });
  }

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Account not found in database" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: {
      accountId: account.id,
      onboardingStatus,
      updated: {
        users: updated.count,
      },
    },
  });
}
