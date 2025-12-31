import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
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
      await prisma.purchase.updateMany({
        where: { creatorPaymentId },
        data: { commissionStatus: "READY_FOR_PAYOUT" },
      });
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

  const details = parseEventDetails(event);
  const accountId = event.account ?? null;
  let projectMatch = accountId
    ? await prisma.project.findFirst({
        where: { creatorStripeAccountId: accountId },
        select: {
          id: true,
          userId: true,
          name: true,
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
        select: { id: true, userId: true, name: true },
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

  const commissionPercent = coupon ? Number(coupon.commissionPercent) : 0;
  const commissionAmount = coupon
    ? Math.round(details.amount * commissionPercent)
    : 0;

  const transferId: string | null = null;
  const status: "PENDING" | "PAID" | "FAILED" =
    coupon && commissionAmount > 0 ? "PENDING" : "PAID";
  const commissionStatus: "PENDING_CREATOR_PAYMENT" | "PAID" =
    coupon && commissionAmount > 0 ? "PENDING_CREATOR_PAYMENT" : "PAID";

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
        type: "COMMISSION_DUE",
        ...notificationMessages.commissionDue(
          projectMatch.name ?? "your project",
        ),
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
