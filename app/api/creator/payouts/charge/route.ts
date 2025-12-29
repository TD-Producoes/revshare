import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const chargeInput = z.object({
  userId: z.string().min(1),
});

function calculateProcessingFee(amountOwed: number) {
  const stripePercentage = 0.029;
  const fixedFee = 30;
  const fee = (amountOwed + fixedFee) / (1 - stripePercentage) - amountOwed;
  return Math.max(0, Math.round(fee));
}

async function buildReceiptPurchases(creatorId: string, paymentId?: string | null) {
  if (paymentId) {
    const payment = await prisma.creatorPayment.findUnique({
      where: { id: paymentId },
      include: {
        purchases: {
          include: {
            project: { select: { platformCommissionPercent: true } },
          },
        },
      },
    });
    if (!payment) {
      return { purchases: [], payment };
    }
    return { purchases: payment.purchases, payment };
  }

  const purchases = await prisma.purchase.findMany({
    where: {
      creatorPaymentId: null,
      commissionAmount: { gt: 0 },
      commissionStatus: "PENDING_CREATOR_PAYMENT",
      project: { userId: creatorId },
    },
    include: {
      project: { select: { platformCommissionPercent: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { purchases, payment: null };
}

export async function POST(request: Request) {
  const parsed = chargeInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const creator = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, stripeCustomerId: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
  if (!creator.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found for this creator." },
      { status: 400 },
    );
  }

  const defaultMethod = await prisma.paymentMethod.findFirst({
    where: { userId: creator.id, isDefault: true },
    select: { stripePaymentMethodId: true },
  });
  if (!defaultMethod) {
    return NextResponse.json(
      { error: "No default payment method found." },
      { status: 400 },
    );
  }

  const existingPayment = await prisma.creatorPayment.findFirst({
    where: { creatorId: creator.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const { purchases, payment } = await buildReceiptPurchases(
    creator.id,
    existingPayment?.id ?? null,
  );

  if (purchases.length === 0) {
    return NextResponse.json(
      { error: "No outstanding commissions to pay." },
      { status: 400 },
    );
  }

  const totals = purchases.reduce(
    (acc, purchase) => {
      const platformPercent =
        Number(purchase.project.platformCommissionPercent) || 0;
      const platformFee = Math.round(purchase.commissionAmount * platformPercent);
      acc.marketerTotal += purchase.commissionAmount;
      acc.platformTotal += platformFee;
      acc.grandTotal += purchase.commissionAmount + platformFee;
      return acc;
    },
    { marketerTotal: 0, platformTotal: 0, grandTotal: 0 },
  );
  const processingFee = calculateProcessingFee(totals.grandTotal);
  const totalWithFee = totals.grandTotal + processingFee;

  const creatorPayment =
    payment ??
    (await prisma.creatorPayment.create({
      data: {
        creatorId: creator.id,
        amountTotal: totalWithFee,
        marketerTotal: totals.marketerTotal,
        platformFeeTotal: totals.platformTotal,
        status: "PENDING",
      },
    }));

  if (!payment) {
    await prisma.purchase.updateMany({
      where: { id: { in: purchases.map((purchase) => purchase.id) } },
      data: { creatorPaymentId: creatorPayment.id },
    });
  }

  const stripe = platformStripe();
  try {
    const intent = await stripe.paymentIntents.create({
      amount: totalWithFee,
      currency: "usd",
      customer: creator.stripeCustomerId,
      payment_method: defaultMethod.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        creatorPaymentId: creatorPayment.id,
        creatorId: creator.id,
      },
    });

    await prisma.creatorPayment.update({
      where: { id: creatorPayment.id },
      data: {
        status: intent.status === "succeeded" ? "PAID" : "PENDING",
        stripePaymentIntentId: intent.id,
      },
    });

    if (intent.status === "succeeded") {
      await prisma.purchase.updateMany({
        where: { creatorPaymentId: creatorPayment.id },
        data: { commissionStatus: "READY_FOR_PAYOUT" },
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
    await prisma.creatorPayment.update({
      where: { id: creatorPayment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
