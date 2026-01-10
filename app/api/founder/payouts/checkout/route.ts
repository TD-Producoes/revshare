import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { notificationMessages } from "@/lib/notifications/messages";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

function defaultUrl(path: string) {
  return `${process.env.BASE_URL}${path}`;
}

async function buildReceiptPurchases(
  creatorId: string,
  paymentId?: string | null
) {
  if (paymentId) {
    const payment = await prisma.creatorPayment.findUnique({
      where: { id: paymentId },
      include: {
        purchases: {
          include: {
            project: {
              select: { name: true, platformCommissionPercent: true },
            },
            coupon: {
              select: {
                marketerId: true,
                marketer: { select: { name: true } },
              },
            },
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
      project: { select: { name: true, platformCommissionPercent: true } },
      coupon: {
        select: { marketerId: true, marketer: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { purchases, payment: null };
}

export async function POST(_request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const creator = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const existingPayment = await prisma.creatorPayment.findFirst({
    where: { creatorId: creator.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const { purchases, payment } = await buildReceiptPurchases(
    creator.id,
    existingPayment?.id ?? null
  );

  if (purchases.length === 0) {
    return NextResponse.json(
      { error: "No outstanding commissions to pay." },
      { status: 400 }
    );
  }

  const totals = purchases.reduce(
    (acc, purchase) => {
      const platformPercent =
        Number(purchase.project.platformCommissionPercent) || 0;
      const platformFee = Math.round(
        purchase.commissionAmount * platformPercent
      );
      acc.marketerTotal += purchase.commissionAmount;
      acc.platformTotal += platformFee;
      acc.grandTotal += purchase.commissionAmount + platformFee;
      return acc;
    },
    { marketerTotal: 0, platformTotal: 0, grandTotal: 0 }
  );
  const processingFee = calculateProcessingFee(totals.grandTotal);
  const totalWithFee = totals.grandTotal + processingFee;

  let creatorPayment = payment ? { id: payment.id } : null;
  let createdNewPayment = false;
  if (!creatorPayment) {
    creatorPayment = await prisma.$transaction(async (tx) => {
      const created = await tx.creatorPayment.create({
        data: {
          creatorId: creator.id,
          amountTotal: totalWithFee,
          marketerTotal: totals.marketerTotal,
          platformFeeTotal: totals.platformTotal,
          status: "PENDING",
        },
      });

      await tx.event.create({
        data: {
          type: "CREATOR_PAYMENT_CREATED",
          actorId: creator.id,
          subjectType: "CreatorPayment",
          subjectId: created.id,
          data: {
            creatorId: creator.id,
            amountTotal: totalWithFee,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: creator.id,
          type: "SYSTEM",
          ...notificationMessages.payoutInvoiceCreated(),
          data: {
            creatorPaymentId: created.id,
          },
        },
      });

      return { id: created.id };
    });
    createdNewPayment = true;
  }

  if (createdNewPayment && creatorPayment) {
    await prisma.purchase.updateMany({
      where: { id: { in: purchases.map((purchase) => purchase.id) } },
      data: { creatorPaymentId: creatorPayment.id },
    });
  }

  const stripe = platformStripe();
  const successUrl =
    process.env.CREATOR_PAYOUT_SUCCESS_URL ??
    defaultUrl("/founder/payouts?payment=success");
  const cancelUrl =
    process.env.CREATOR_PAYOUT_CANCEL_URL ??
    defaultUrl("/founder/payouts?payment=cancel");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Affiliate commission payout",
            description: `Marketers: ${totals.marketerTotal / 100}, Platform: ${
              totals.platformTotal / 100
            }, Processing: ${processingFee / 100}`,
          },
          unit_amount: totalWithFee,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      creatorPaymentId: creatorPayment.id,
      creatorId: creator.id,
    },
  });

  await prisma.creatorPayment.update({
    where: { id: creatorPayment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return NextResponse.json({
    data: {
      id: session.id,
      url: session.url,
      creatorPaymentId: creatorPayment.id,
    },
  });
}
function calculateProcessingFee(amountOwed: number) {
  const stripePercentage = 0.029;
  const fixedFee = 30;
  const fee = (amountOwed + fixedFee) / (1 - stripePercentage) - amountOwed;
  return Math.max(0, Math.round(fee));
}
