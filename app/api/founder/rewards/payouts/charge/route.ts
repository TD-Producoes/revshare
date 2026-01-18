import { NextResponse } from "next/server";
import { z } from "zod";

import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import {
  calculateProcessingFee,
  createRewardTransfers,
  fetchRewardPayoutRows,
} from "@/lib/rewards/payouts";

const chargeInput = z.object({
  paymentMethodId: z.string().min(1).optional(),
  currency: z.string().min(1),
});

export async function POST(request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const parsed = chargeInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const creator = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true, stripeCustomerId: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }
  if (!creator.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found for this founder." },
      { status: 400 },
    );
  }

  const chosenMethod = payload.paymentMethodId
    ? await prisma.paymentMethod.findFirst({
        where: { id: payload.paymentMethodId, userId: creator.id },
        select: { stripePaymentMethodId: true },
      })
    : await prisma.paymentMethod.findFirst({
        where: { userId: creator.id, isDefault: true },
        select: { stripePaymentMethodId: true },
      });

  if (!chosenMethod) {
    return NextResponse.json(
      { error: "No payment method found for this founder." },
      { status: 400 },
    );
  }

  const currency = payload.currency.toUpperCase();
  const cutoff = new Date();
  const { rows, totalAmount } = await fetchRewardPayoutRows({
    creatorId: creator.id,
    currency,
    cutoff,
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No reward payouts available for this currency." },
      { status: 400 },
    );
  }

  const processingFee = calculateProcessingFee(totalAmount);
  const totalWithFee = totalAmount + processingFee;

  const stripe = platformStripe();
  try {
    const intent = await stripe.paymentIntents.create({
      amount: totalWithFee,
      currency: currency.toLowerCase(),
      customer: creator.stripeCustomerId,
      payment_method: chosenMethod.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        creatorId: creator.id,
        rewardPayoutType: "REWARD_PAYOUT",
        currency,
      },
    });

    if (intent.status === "succeeded") {
      await createRewardTransfers({
        creatorId: creator.id,
        currency,
        cutoff,
      });
    }

    return NextResponse.json({
      data: {
        id: intent.id,
        status: intent.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to charge payment method.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
