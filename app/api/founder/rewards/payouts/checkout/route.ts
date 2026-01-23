import { NextResponse } from "next/server";
import { z } from "zod";

import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import {
  calculateProcessingFee,
  fetchRewardPayoutRows,
} from "@/lib/rewards/payouts";

const checkoutInput = z.object({
  currency: z.string().min(1),
});

function defaultUrl(path: string) {
  return `${process.env.BASE_URL}${path}`;
}

export async function POST(request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const parsed = checkoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const creator = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const currency = parsed.data.currency.toUpperCase();
  const cutoffMs = Date.now();
  const { rows, totalAmount } = await fetchRewardPayoutRows({
    creatorId: creator.id,
    currency,
    cutoff: new Date(cutoffMs),
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No reward payouts available for this currency." },
      { status: 400 },
    );
  }

  const processingFee = calculateProcessingFee(totalAmount);
  const totalWithFee = totalAmount + processingFee;
  const stripeCurrency = currency.toLowerCase();

  const stripe = platformStripe();
  const successUrl =
    process.env.REWARD_PAYOUT_SUCCESS_URL ??
    defaultUrl("/founder/payouts?reward=success");
  const cancelUrl =
    process.env.REWARD_PAYOUT_CANCEL_URL ??
    defaultUrl("/founder/payouts?reward=cancel");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: "Reward payouts",
            description: `Rewards: ${totalAmount / 100}, Processing: ${processingFee / 100}`,
          },
          unit_amount: totalWithFee,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      rewardPayoutType: "REWARD_PAYOUT",
      creatorId: creator.id,
      currency,
      cutoffMs: String(cutoffMs),
    },
  });

  return NextResponse.json({
    data: {
      id: session.id,
      url: session.url,
    },
  });
}
