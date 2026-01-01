import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { notificationMessages } from "@/lib/notifications/messages";

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

  let details = parseEventDetails(event);
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
      details = { ...details, promotionCodeId: promo ?? details.promotionCodeId };
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
      details = { ...details, promotionCodeId: promo ?? details.promotionCodeId };
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
        include: { marketer: true },
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
        select: { refundWindowDays: true },
      })
    : null;

  const commissionPercent = coupon ? Number(coupon.commissionPercent) : 0;
  const commissionAmount = coupon
    ? Math.round(details.amount * commissionPercent)
    : 0;

  const transferId: string | null = null;
  const status: "PENDING" | "PAID" | "FAILED" =
    coupon && commissionAmount > 0 ? "PENDING" : "PAID";
  const commissionStatus: "PENDING_CREATOR_PAYMENT" | "PAID" =
    coupon && commissionAmount > 0 ? "PENDING_CREATOR_PAYMENT" : "PAID";
  const refundWindowDays =
    contract?.refundWindowDays ?? projectMatch.refundWindowDays ?? 30;
  const eventCreatedAt = new Date(event.created * 1000);
  const refundEligibleAt = new Date(
    eventCreatedAt.getTime() + refundWindowDays * 24 * 60 * 60 * 1000,
  );

  console.log(`Creating purchase record for event ${event.id}`);
  const purchase = await prisma.purchase.create({
    data: {
      projectId: projectMatch.id,
      couponId: coupon?.id ?? null,
      stripeEventId: event.id,
      stripeChargeId: details.stripeChargeId,
      stripeInvoiceId: details.stripeInvoiceId,
      stripePaymentIntentId: details.stripePaymentIntentId,
      amount: details.amount,
      currency: details.currency,
      customerEmail: details.customerEmail,
      commissionAmount,
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
      actorId: coupon?.marketerId ?? null,
      projectId: projectMatch.id,
      subjectType: "Purchase",
      subjectId: purchase.id,
      data: {
        projectId: projectMatch.id,
        couponId: coupon?.id ?? null,
        amount: details.amount,
        currency: details.currency,
      },
    },
  });

  if (coupon?.marketerId) {
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
  }

  if (projectMatch.userId) {
    await prisma.notification.create({
      data: {
        userId: projectMatch.userId,
        type: coupon?.id ? "COMMISSION_DUE" : "SALE",
        ...(coupon?.id
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
