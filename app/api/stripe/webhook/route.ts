import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as React from "react";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { notificationMessages } from "@/lib/notifications/messages";
import { sendEmail } from "@/lib/email/send-email";
import ReferralSaleEmail from "@/emails/ReferralSaleEmail";

export const runtime = "nodejs";

// Helper to extract promotion code ID from any discount type
// All discount types have the same structure for promotion_code
function promotionCodeIdFromDiscount(
  discount?: Stripe.Discount | Stripe.Checkout.Session.Discount | null
) {
  if (!discount || !discount.promotion_code) {
    return null;
  }
  if (typeof discount.promotion_code === "string") {
    return discount.promotion_code;
  }
  return discount.promotion_code.id;
}

function promotionCodeIdFromAny(
  discounts:
    | Stripe.Discount[]
    | Stripe.Checkout.Session.Discount[]
    | null
    | undefined
) {
  if (!discounts || discounts.length === 0) {
    return null;
  }
  return promotionCodeIdFromDiscount(discounts[0]);
}

function resolvePurchaseStatusAfterDispute(
  purchase: {
    commissionAmount: number;
    couponId: string | null;
    refundEligibleAt: Date | null;
    creatorPaymentId: string | null;
    status: "PENDING" | "PAID" | "FAILED";
  },
  now: Date,
) {
  if (!purchase.couponId || purchase.commissionAmount <= 0) {
    return "PAID" as const;
  }
  if (purchase.status === "PAID") {
    return "PAID" as const;
  }
  if (purchase.refundEligibleAt && purchase.refundEligibleAt > now) {
    return "AWAITING_REFUND_WINDOW" as const;
  }
  return purchase.creatorPaymentId ? "READY_FOR_PAYOUT" : "PENDING_CREATOR_PAYMENT";
}

async function findPurchaseForCharge(params: {
  chargeId: string;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
}) {
  const { chargeId, paymentIntentId, invoiceId } = params;
  const orConditions = [
    { stripeChargeId: chargeId },
    paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : null,
    invoiceId ? { stripeInvoiceId: invoiceId } : null,
  ].filter(Boolean) as Array<{
    stripeChargeId?: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
  }>;

  return prisma.purchase.findFirst({
    where: { OR: orConditions },
    select: {
      id: true,
      projectId: true,
      couponId: true,
      amount: true,
      currency: true,
      commissionAmount: true,
      commissionAmountOriginal: true,
      commissionStatus: true,
      refundedAmount: true,
      refundEligibleAt: true,
      disputeId: true,
      disputeStatus: true,
      creatorPaymentId: true,
      status: true,
      project: { select: { name: true, userId: true } },
      coupon: { select: { marketerId: true } },
    },
  });
}

function parseEventDetails(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // session.discounts is already Stripe.Checkout.Session.Discount[] | null
    const sessionDiscounts = session.discounts;
    return {
      amount: session.amount_total ?? session.amount_subtotal ?? 0,
      currency: session.currency ?? "usd",
      customerEmail: session.customer_details?.email ?? session.customer_email,
      stripeChargeId: null,
      stripeInvoiceId:
        typeof session.invoice === "string" ? session.invoice : null,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      promotionCodeId: promotionCodeIdFromAny(sessionDiscounts ?? undefined),
    };
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    // Invoice discounts are Stripe.Discount[] | null
    const invoiceDiscounts = invoice.discounts as Stripe.Discount[] | null;
    // Invoice charge and payment_intent may be in different locations
    const invoiceWithExtras = invoice as Stripe.Invoice & {
      charge?: string | Stripe.Charge | null;
      payment_intent?: string | Stripe.PaymentIntent | null;
    };
    return {
      amount: invoice.amount_paid,
      currency: invoice.currency ?? "usd",
      customerEmail: invoice.customer_email ?? undefined,
      stripeChargeId:
        typeof invoiceWithExtras.charge === "string"
          ? invoiceWithExtras.charge
          : null,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId:
        typeof invoiceWithExtras.payment_intent === "string"
          ? invoiceWithExtras.payment_intent
          : null,
      promotionCodeId: promotionCodeIdFromAny(invoiceDiscounts ?? undefined),
    };
  }

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    // Charge may not have discounts directly, check if it exists
    const chargeWithExtras = charge as Stripe.Charge & {
      discounts?: Stripe.Discount[] | null;
      invoice?: string | Stripe.Invoice | null;
      payment_intent?: string | Stripe.PaymentIntent | null;
    };
    const chargeDiscounts = chargeWithExtras.discounts;
    return {
      amount: charge.amount,
      currency: charge.currency ?? "usd",
      customerEmail:
        charge.billing_details?.email ?? charge.receipt_email ?? undefined,
      stripeChargeId: charge.id,
      stripeInvoiceId:
        typeof chargeWithExtras.invoice === "string"
          ? chargeWithExtras.invoice
          : null,
      stripePaymentIntentId:
        typeof chargeWithExtras.payment_intent === "string"
          ? chargeWithExtras.payment_intent
          : null,
      promotionCodeId: promotionCodeIdFromAny(chargeDiscounts ?? undefined),
    };
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    return {
      amount: intent.amount,
      currency: intent.currency ?? "usd",
      customerEmail: undefined,
      stripeChargeId: null,
      stripeInvoiceId: null,
      stripePaymentIntentId: intent.id,
      promotionCodeId: null,
    };
  }

  return null;
}

type EventDetails = NonNullable<ReturnType<typeof parseEventDetails>>;

function extractProjectId(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.projectId ?? session.client_reference_id ?? null;
  }
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const parentMetadata =
      invoice.parent?.subscription_details?.metadata ?? null;
    const subscriptionMetadata =
      (invoice as { subscription_details?: { metadata?: Stripe.Metadata } })
        .subscription_details?.metadata ?? null;
    return (
      invoice.metadata?.projectId ??
      parentMetadata?.projectId ??
      subscriptionMetadata?.projectId ??
      null
    );
  }
  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    return charge.metadata?.projectId ?? null;
  }
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    return intent.metadata?.projectId ?? null;
  }
  return null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.log("Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const webhookSecretsRaw =
    process.env.STRIPE_WEBHOOK_SECRET_OVERRIDE ??
    process.env.PLATFORM_STRIPE_WEBHOOK_SECRET;
  const webhookSecrets = webhookSecretsRaw
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!webhookSecrets || webhookSecrets.length === 0) {
    return NextResponse.json(
      { error: "Webhook secret missing" },
      { status: 500 }
    );
  }

  const verifier = new Stripe(
    process.env.PLATFORM_STRIPE_SECRET_KEY ?? "sk_test_placeholder",
    {}
  );

  let event: Stripe.Event | null = null;
  for (const secret of webhookSecrets) {
    try {
      event = verifier.webhooks.constructEvent(payload, signature, secret);
      break;
    } catch {
      event = null;
    }
  }
  if (!event) {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const creatorPaymentId = session.metadata?.creatorPaymentId ?? null;
    if (creatorPaymentId) {
      const updatedPayment = await prisma.creatorPayment.update({
        where: { id: creatorPaymentId },
        data: {
          status: "PAID",
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        },
        select: { id: true, creatorId: true },
      });
      const purchases = await prisma.purchase.findMany({
        where: { creatorPaymentId },
        select: {
          id: true,
          createdAt: true,
          refundEligibleAt: true,
          refundWindowDays: true,
          project: { select: { refundWindowDays: true } },
        },
      });
      const now = new Date();
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
          eligibleAt <= now ? "READY_FOR_PAYOUT" : "AWAITING_REFUND_WINDOW";

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
      await prisma.event.create({
        data: {
          type: "CREATOR_PAYMENT_COMPLETED",
          actorId: updatedPayment.creatorId,
          subjectType: "CreatorPayment",
          subjectId: updatedPayment.id,
          data: {
            creatorPaymentId: updatedPayment.id,
          },
        },
      });
      await prisma.notification.create({
        data: {
          userId: updatedPayment.creatorId,
          type: "SYSTEM",
          ...notificationMessages.payoutInvoicePaid(),
          data: {
            creatorPaymentId: updatedPayment.id,
          },
        },
      });
      return NextResponse.json({ received: true, creatorPaymentId });
    }
    if (session.mode === "subscription") {
      return NextResponse.json({ received: true });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  if (event.type === "charge.succeeded") {
    return NextResponse.json({ received: true });
  }

  const eventType = event.type as string;
  if (
    eventType === "charge.refunded" ||
    eventType === "charge.refund.created" ||
    eventType === "charge.refund.updated"
  ) {
    const eventCreatedAt = new Date(event.created * 1000);
    const charge =
      eventType === "charge.refunded"
        ? (event.data.object as Stripe.Charge)
        : null;
    const refund =
      eventType === "charge.refunded"
        ? null
        : (event.data.object as Stripe.Refund);
    const chargeId =
      typeof charge?.id === "string"
        ? charge.id
        : typeof refund?.charge === "string"
          ? refund.charge
          : null;

    if (!chargeId) {
      return NextResponse.json({ received: true });
    }

    const purchase = await findPurchaseForCharge({
      chargeId,
      paymentIntentId:
        charge && typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : null,
      invoiceId:
        charge && typeof (charge as Stripe.Charge & { invoice?: string }).invoice === "string"
          ? (charge as Stripe.Charge & { invoice?: string }).invoice
          : null,
    });

    if (!purchase) {
      return NextResponse.json({ received: true });
    }

    const nextRefundedAmount = Math.min(
      purchase.amount,
      charge?.amount_refunded != null
        ? charge.amount_refunded
        : (purchase.refundedAmount ?? 0) + (refund?.amount ?? 0),
    );
    const previousRefundedAmount = purchase.refundedAmount ?? 0;
    if (nextRefundedAmount === previousRefundedAmount) {
      return NextResponse.json({ received: true });
    }
    const commissionBase =
      purchase.commissionAmountOriginal ?? purchase.commissionAmount;
    const deltaRefunded = Math.max(0, nextRefundedAmount - previousRefundedAmount);
    const deltaCommission =
      purchase.amount > 0
        ? Math.round((commissionBase * deltaRefunded) / purchase.amount)
        : 0;
    const netAmount = Math.max(0, purchase.amount - nextRefundedAmount);
    const nextCommissionAmount =
      purchase.amount > 0
        ? Math.round((commissionBase * netAmount) / purchase.amount)
        : 0;
    const isFullyRefunded = nextRefundedAmount >= purchase.amount;
    const isSettled =
      purchase.commissionStatus === "PAID" || purchase.status === "PAID";

    const updateData: {
      refundedAmount: number;
      refundedAt: Date;
      commissionAmountOriginal?: number;
      commissionAmount?: number;
      commissionStatus?: "REFUNDED";
    } = {
      refundedAmount: nextRefundedAmount,
      refundedAt: eventCreatedAt,
    };

    if (purchase.commissionAmountOriginal == null) {
      updateData.commissionAmountOriginal = purchase.commissionAmount;
    }
    if (!isSettled) {
      updateData.commissionAmount = nextCommissionAmount;
      if (isFullyRefunded) {
        updateData.commissionStatus = "REFUNDED";
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: updateData,
      });

      if (
        isSettled &&
        deltaCommission > 0 &&
        purchase.coupon?.marketerId
      ) {
        await tx.commissionAdjustment.create({
          data: {
            creatorId: purchase.project.userId,
            marketerId: purchase.coupon.marketerId,
            projectId: purchase.projectId,
            purchaseId: purchase.id,
            amount: -deltaCommission,
            currency: purchase.currency,
            reason: "REFUND",
          },
        });
      }

      await tx.event.create({
        data: {
          type: "PURCHASE_REFUNDED",
          actorId: null,
          projectId: purchase.projectId,
          subjectType: "Purchase",
          subjectId: purchase.id,
          data: {
            purchaseId: purchase.id,
            refundAmount: nextRefundedAmount,
            commissionAmount: nextCommissionAmount,
            currency: purchase.currency,
          },
        },
      });

      const projectName = purchase.project?.name ?? "your project";
      if (purchase.coupon?.marketerId) {
        await tx.notification.create({
          data: {
            userId: purchase.coupon.marketerId,
            type: "REFUND",
            ...notificationMessages.refundRecorded(
              projectName,
              nextRefundedAmount,
              nextCommissionAmount,
              purchase.currency,
            ),
            data: {
              projectId: purchase.projectId,
              purchaseId: purchase.id,
              refundAmount: nextRefundedAmount,
            },
          },
        });
      }

      if (purchase.project?.userId) {
        await tx.notification.create({
          data: {
            userId: purchase.project.userId,
            type: "REFUND",
            ...notificationMessages.refundRecorded(
              projectName,
              nextRefundedAmount,
              nextCommissionAmount,
              purchase.currency,
            ),
            data: {
              projectId: purchase.projectId,
              purchaseId: purchase.id,
              refundAmount: nextRefundedAmount,
            },
          },
        });
      }
    });

    return NextResponse.json({ received: true });
  }

  if (
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.updated" ||
    event.type === "charge.dispute.closed"
  ) {
    const dispute = event.data.object as Stripe.Dispute;
    const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;
    if (!chargeId) {
      return NextResponse.json({ received: true });
    }

    const purchase = await findPurchaseForCharge({ chargeId });
    if (!purchase) {
      return NextResponse.json({ received: true });
    }

    const eventCreatedAt = new Date(event.created * 1000);
    const now = new Date();
    const isWon = dispute.status === "won";
    const nextStatus = isWon
      ? resolvePurchaseStatusAfterDispute(purchase, now)
      : "CHARGEBACK";

    if (
      purchase.disputeId === dispute.id &&
      purchase.disputeStatus === dispute.status &&
      purchase.commissionStatus === nextStatus
    ) {
      return NextResponse.json({ received: true });
    }

    const commissionBase =
      purchase.commissionAmountOriginal ?? purchase.commissionAmount;
    const commissionFromDispute =
      purchase.amount > 0
        ? Math.round((commissionBase * (dispute.amount ?? 0)) / purchase.amount)
        : commissionBase;

    await prisma.$transaction(async (tx) => {
      const existingAdjustments = await tx.commissionAdjustment.findMany({
        where: {
          purchaseId: purchase.id,
          reason: "CHARGEBACK",
          status: { in: ["PENDING", "APPLIED"] },
        },
      });

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          disputeId: dispute.id,
          disputeStatus: dispute.status ?? null,
          chargebackAt: !isWon ? eventCreatedAt : null,
          commissionStatus:
            purchase.commissionStatus === "PAID" || purchase.status === "PAID"
              ? purchase.commissionStatus
              : nextStatus,
        },
      });

      if (purchase.coupon?.marketerId) {
        if (!isWon && existingAdjustments.length === 0 && commissionFromDispute > 0) {
          await tx.commissionAdjustment.create({
            data: {
              creatorId: purchase.project.userId,
              marketerId: purchase.coupon.marketerId,
              projectId: purchase.projectId,
              purchaseId: purchase.id,
              amount: -commissionFromDispute,
              currency: purchase.currency,
              reason: "CHARGEBACK",
            },
          });
        }
        if (isWon && existingAdjustments.length > 0) {
          const totalAdjustment = existingAdjustments.reduce(
            (acc, adj) => acc + adj.amount,
            0,
          );
          if (totalAdjustment < 0) {
            await tx.commissionAdjustment.create({
              data: {
                creatorId: purchase.project.userId,
                marketerId: purchase.coupon.marketerId,
                projectId: purchase.projectId,
                purchaseId: purchase.id,
                amount: Math.abs(totalAdjustment),
                currency: purchase.currency,
                reason: "CHARGEBACK_REVERSAL",
              },
            });
          }
          await tx.commissionAdjustment.updateMany({
            where: { id: { in: existingAdjustments.map((adj) => adj.id) } },
            data: { status: "REVERSED" },
          });
        }
      }

      await tx.event.create({
        data: {
          type: isWon ? "PURCHASE_CHARGEBACK_RESOLVED" : "PURCHASE_CHARGEBACK",
          actorId: null,
          projectId: purchase.projectId,
          subjectType: "Purchase",
          subjectId: purchase.id,
          data: {
            purchaseId: purchase.id,
            disputeId: dispute.id,
            disputeStatus: dispute.status,
            amount: dispute.amount,
            currency: dispute.currency,
          },
        },
      });

      const projectName = purchase.project?.name ?? "your project";
      const notificationPayload = isWon
        ? notificationMessages.chargebackResolved(
            projectName,
            dispute.amount,
            dispute.currency ?? purchase.currency,
          )
        : notificationMessages.chargebackCreated(
            projectName,
            dispute.amount,
            dispute.currency ?? purchase.currency,
          );

      if (purchase.coupon?.marketerId) {
        await tx.notification.create({
          data: {
            userId: purchase.coupon.marketerId,
            type: "CHARGEBACK",
            ...notificationPayload,
            data: {
              projectId: purchase.projectId,
              purchaseId: purchase.id,
              disputeId: dispute.id,
              disputeStatus: dispute.status,
            },
          },
        });
      }

      if (purchase.project?.userId) {
        await tx.notification.create({
          data: {
            userId: purchase.project.userId,
            type: "CHARGEBACK",
            ...notificationPayload,
            data: {
              projectId: purchase.projectId,
              purchaseId: purchase.id,
              disputeId: dispute.id,
              disputeStatus: dispute.status,
            },
          },
        });
      }
    });

    return NextResponse.json({ received: true });
  }

  let details = parseEventDetails(event) as EventDetails | null;
  const accountId = event.account ?? null;
  if (details && !details.promotionCodeId && accountId) {
    const stripe = platformStripe();
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const refreshed = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ["discounts"] },
        { stripeAccount: accountId },
      );
      const promo = promotionCodeIdFromAny(refreshed.discounts ?? undefined);
      details = {
        ...details,
        promotionCodeId: promo ?? details.promotionCodeId ?? null,
      } as EventDetails;
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const refreshed = await stripe.invoices.retrieve(
        invoice.id,
        { expand: ["discounts"] },
        { stripeAccount: accountId },
      );
      const promo = promotionCodeIdFromAny(
        (refreshed.discounts as Stripe.Discount[] | null) ?? undefined,
      );
      details = {
        ...details,
        promotionCodeId: promo ?? details.promotionCodeId ?? null,
      } as EventDetails;
    }
  }
  let projectMatch = accountId
    ? await prisma.project.findFirst({
        where: { creatorStripeAccountId: accountId },
        select: {
          id: true,
          userId: true,
          name: true,
          refundWindowDays: true,
        },
      })
    : null;

  if (!projectMatch && details?.promotionCodeId) {
    const couponMatch = await prisma.coupon.findUnique({
      where: { stripePromotionCodeId: details.promotionCodeId },
      select: { projectId: true },
    });
    if (couponMatch?.projectId) {
      projectMatch = await prisma.project.findFirst({
        where: { id: couponMatch.projectId },
        select: { id: true, userId: true, name: true, refundWindowDays: true },
      });
    }
  }

  if (!projectMatch) {
    const projectId = extractProjectId(event);
    if (projectId) {
      projectMatch = await prisma.project.findFirst({
        where: { id: projectId },
        select: {
          id: true,
          userId: true,
          name: true,
          refundWindowDays: true,
        },
      });
    }
  }

  if (!projectMatch) {
    return NextResponse.json(
      {
        error:
          "Project not found for webhook event. Ensure the event has account or metadata.projectId.",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.purchase.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    console.log(`Duplicate event received: ${event.id}`);
    return NextResponse.json({ received: true });
  }

  if (!details) {
    return NextResponse.json({ received: true });
  }

  const orConditions = [
    details.stripeChargeId ? { stripeChargeId: details.stripeChargeId } : null,
    details.stripeInvoiceId
      ? { stripeInvoiceId: details.stripeInvoiceId }
      : null,
    details.stripePaymentIntentId
      ? { stripePaymentIntentId: details.stripePaymentIntentId }
      : null,
  ].filter(Boolean) as Array<{
    stripeChargeId?: string;
    stripeInvoiceId?: string;
    stripePaymentIntentId?: string;
  }>;

  if (orConditions.length > 0) {
    console.log(
      "Checking for duplicate purchase with conditions:",
      orConditions
    );
    const duplicate = await prisma.purchase.findFirst({
      where: {
        projectId: projectMatch.id,
        OR: orConditions,
      },
    });
    if (duplicate) {
      return NextResponse.json({ received: true });
    }
  }

  const coupon = details.promotionCodeId
    ? await prisma.coupon.findUnique({
        where: { stripePromotionCodeId: details.promotionCodeId },
        select: {
          id: true,
          marketerId: true,
          commissionPercent: true,
        },
      })
    : null;

  const contract = coupon
    ? await prisma.contract.findUnique({
        where: {
          projectId_userId: {
            projectId: projectMatch.id,
            userId: coupon.marketerId,
          },
        },
        select: { refundWindowDays: true, status: true },
      })
    : null;

  // Only associate purchase with marketer if contract is approved
  const isContractApproved = contract?.status === "APPROVED";
  const commissionPercent = coupon && isContractApproved ? Number(coupon.commissionPercent) : 0;
  const commissionAmount = coupon && isContractApproved
    ? Math.round(details.amount * commissionPercent)
    : 0;

  const transferId: string | null = null;
  const status: "PENDING" | "PAID" | "FAILED" =
    coupon && commissionAmount > 0 ? "PENDING" : "PAID";
  const refundWindowDays =
    contract?.refundWindowDays ?? projectMatch.refundWindowDays ?? 30;
  const eventCreatedAt = new Date(event.created * 1000);
  const refundEligibleAt = new Date(
    eventCreatedAt.getTime() + refundWindowDays * 24 * 60 * 60 * 1000,
  );
  const isRefundEligible = refundEligibleAt <= new Date();
  const commissionStatus:
    | "AWAITING_REFUND_WINDOW"
    | "PENDING_CREATOR_PAYMENT"
    | "PAID" =
    coupon && commissionAmount > 0
      ? isRefundEligible
        ? "PENDING_CREATOR_PAYMENT"
        : "AWAITING_REFUND_WINDOW"
      : "PAID";

  console.log(`Creating purchase record for event ${event.id}`);
  const purchase = await prisma.purchase.create({
    data: {
      projectId: projectMatch.id,
      couponId: coupon && isContractApproved ? coupon.id : null,
      marketerId: coupon && isContractApproved ? coupon.marketerId : null,
      stripeEventId: event.id,
      stripeChargeId: details.stripeChargeId,
      stripeInvoiceId: details.stripeInvoiceId,
      stripePaymentIntentId: details.stripePaymentIntentId,
      amount: details.amount,
      currency: details.currency,
      customerEmail: details.customerEmail,
      commissionAmount,
      commissionAmountOriginal: commissionAmount,
      refundWindowDays,
      refundEligibleAt,
      transferId,
      commissionStatus,
      status,
    },
    select: {
      id: true,
      projectId: true,
      couponId: true,
    },
  });

  await prisma.event.create({
    data: {
      type: "PURCHASE_CREATED",
      actorId: coupon && isContractApproved ? coupon.marketerId : null,
      projectId: projectMatch.id,
      subjectType: "Purchase",
      subjectId: purchase.id,
      data: {
        projectId: projectMatch.id,
        couponId: coupon && isContractApproved ? coupon.id : null,
        amount: details.amount,
        currency: details.currency,
      },
    },
  });

  if (coupon?.marketerId && isContractApproved) {
    await prisma.notification.create({
      data: {
        userId: coupon.marketerId,
        type: "SALE",
        ...notificationMessages.referralSale(commissionAmount, details.currency),
        data: {
          projectId: projectMatch.id,
          purchaseId: purchase.id,
          commissionAmount,
        },
      },
    });

    const canSendEmail = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL,
    );
    const marketer = await prisma.user.findUnique({
      where: { id: coupon.marketerId },
      select: {
        email: true,
        name: true,
        notificationPreference: { select: { emailEnabled: true } },
      },
    });
    const emailEnabled = marketer?.notificationPreference?.emailEnabled;
    const marketerEmail = marketer?.email;

    if (canSendEmail && emailEnabled && marketerEmail) {
      const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

      try {
        void sendEmail({
          to: marketerEmail,
          subject: "New referral sale",
          react: React.createElement(ReferralSaleEmail, {
            name: marketer?.name,
            projectName: projectMatch.name ?? "your project",
            commissionAmount,
            currency: details.currency,
            dashboardUrl: `${baseUrl}/marketer/earnings`,
          }),
          text: `New referral sale on ${
            projectMatch.name ?? "your project"
          }. Commission ${Math.round(commissionAmount) / 100} ${details.currency.toUpperCase()}.`,
        }).catch((error) => {
          console.error("Failed to send referral sale email", error);
        });
      } catch (error) {
        console.error("Failed to queue referral sale email", error);
      }
    }
  }

  if (projectMatch.userId) {
    await prisma.notification.create({
      data: {
        userId: projectMatch.userId,
        type: coupon?.id && isContractApproved ? "COMMISSION_DUE" : "SALE",
        ...(coupon?.id && isContractApproved
          ? notificationMessages.commissionDue(
              projectMatch.name ?? "your project",
              details.amount,
              commissionAmount,
              details.currency,
            )
          : notificationMessages.newSale(
              projectMatch.name ?? "your project",
              details.amount,
              details.currency,
            )),
        data: {
          projectId: projectMatch.id,
          purchaseId: purchase.id,
          commissionAmount,
        },
      },
    });
  }

  return NextResponse.json({ received: true });
}
