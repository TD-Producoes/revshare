import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const chargeInput = z.object({
  paymentMethodId: z.string().min(1).optional(),
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

  const now = new Date();
  const purchases = await prisma.purchase.findMany({
    where: {
      creatorPaymentId: null,
      commissionAmount: { gt: 0 },
      project: { userId: creatorId },
      OR: [
        { commissionStatus: "PENDING_CREATOR_PAYMENT" },
        {
          commissionStatus: "AWAITING_REFUND_WINDOW",
          refundEligibleAt: { lte: now },
        },
      ],
    },
    include: {
      project: { select: { platformCommissionPercent: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { purchases, payment: null };
}

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

    await prisma.event.create({
      data: {
        type: "CREATOR_PAYMENT_CREATED",
        actorId: creator.id,
        subjectType: "CreatorPayment",
        subjectId: creatorPayment.id,
        data: {
          creatorId: creator.id,
          amountTotal: creatorPayment.amountTotal,
          marketerTotal: creatorPayment.marketerTotal,
          platformFeeTotal: creatorPayment.platformFeeTotal,
          purchaseCount: purchases.length,
        },
      },
    });
  }

  const stripe = platformStripe();
  try {
    const intent = await stripe.paymentIntents.create({
      amount: totalWithFee,
      currency: "usd",
      customer: creator.stripeCustomerId,
      payment_method: chosenMethod.stripePaymentMethodId,
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
      await prisma.event.create({
        data: {
          type: "CREATOR_PAYMENT_COMPLETED",
          actorId: creator.id,
          subjectType: "CreatorPayment",
          subjectId: creatorPayment.id,
          data: {
            creatorId: creator.id,
            amountTotal: creatorPayment.amountTotal,
            marketerTotal: creatorPayment.marketerTotal,
            platformFeeTotal: creatorPayment.platformFeeTotal,
            paymentIntentId: intent.id,
          },
        },
      });

      const purchases = await prisma.purchase.findMany({
        where: { creatorPaymentId: creatorPayment.id },
        select: {
          id: true,
          createdAt: true,
          refundEligibleAt: true,
          refundWindowDays: true,
          project: { select: { refundWindowDays: true } },
        },
      });
      const readyIds: string[] = [];
      const awaitingIds: string[] = [];
      const backfillUpdates: Promise<unknown>[] = [];

      purchases.forEach((purchase) => {
        const effectiveDays =
          purchase.refundWindowDays ??
          purchase.project.refundWindowDays ??
          30;
        const eligibleAt =
          purchase.refundEligibleAt ??
          new Date(
            purchase.createdAt.getTime() + effectiveDays * 24 * 60 * 60 * 1000,
          );
        const nextStatus =
          eligibleAt <= new Date()
            ? "READY_FOR_PAYOUT"
            : "AWAITING_REFUND_WINDOW";

        if (purchase.refundEligibleAt == null || purchase.refundWindowDays == null) {
          backfillUpdates.push(
            prisma.purchase.update({
              where: { id: purchase.id },
              data: {
                refundWindowDays: effectiveDays,
                refundEligibleAt: eligibleAt,
                commissionStatus: nextStatus,
              },
            }),
          );
        } else if (nextStatus === "READY_FOR_PAYOUT") {
          readyIds.push(purchase.id);
        } else {
          awaitingIds.push(purchase.id);
        }
      });

      if (readyIds.length > 0) {
        await prisma.purchase.updateMany({
          where: { id: { in: readyIds } },
          data: { commissionStatus: "READY_FOR_PAYOUT" },
        });
      }
      if (awaitingIds.length > 0) {
        await prisma.purchase.updateMany({
          where: { id: { in: awaitingIds } },
          data: { commissionStatus: "AWAITING_REFUND_WINDOW" },
        });
      }
      if (backfillUpdates.length > 0) {
        await Promise.all(backfillUpdates);
      }
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
