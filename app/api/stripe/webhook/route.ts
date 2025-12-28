import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function processPendingTransfers() {
  const stripe = platformStripe();
  const pendingPurchases = await prisma.purchase.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      transferId: null,
      commissionAmount: { gt: 0 },
    },
    include: {
      coupon: {
        include: { marketer: true },
      },
    },
  });

  let processed = 0;
  let paid = 0;
  let failed = 0;
  let skipped = 0;

  for (const purchase of pendingPurchases) {
    processed += 1;
    const marketerAccountId =
      purchase.coupon?.marketer?.stripeConnectedAccountId ?? null;
    if (!marketerAccountId) {
      skipped += 1;
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: purchase.commissionAmount,
        currency: purchase.currency,
        destination: marketerAccountId,
        metadata: {
          projectId: purchase.projectId,
          couponId: purchase.couponId ?? "",
          purchaseId: purchase.id,
        },
      });

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          transferId: transfer.id,
          status: "PAID",
        },
      });
      paid += 1;
    } catch (error) {
      console.error("Error retrying commission transfer:", error);
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: "FAILED" },
      });
      failed += 1;
    }
  }

  return { processed, paid, failed, skipped };
}

function promotionCodeIdFromDiscount(discount?: Stripe.Discount | null) {
  if (!discount || !discount.promotion_code) {
    return null;
  }
  if (typeof discount.promotion_code === "string") {
    return discount.promotion_code;
  }
  return discount.promotion_code.id;
}

function promotionCodeIdFromAny(discounts: Stripe.Discount[] | null | undefined) {
  if (!discounts || discounts.length === 0) {
    return null;
  }
  return promotionCodeIdFromDiscount(discounts[0]);
}

function parseEventDetails(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionDiscounts = (session as { discounts?: Stripe.Discount[] })
      .discounts;
    return {
      amount: session.amount_total ?? session.amount_subtotal ?? 0,
      currency: session.currency ?? "usd",
      customerEmail: session.customer_details?.email ?? session.customer_email,
      stripeChargeId: null,
      stripeInvoiceId: typeof session.invoice === "string" ? session.invoice : null,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      promotionCodeId: promotionCodeIdFromAny(sessionDiscounts ?? undefined),
    };
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const invoiceDiscounts = (invoice as { discounts?: Stripe.Discount[] })
      .discounts;
    return {
      amount: invoice.amount_paid,
      currency: invoice.currency ?? "usd",
      customerEmail: invoice.customer_email ?? undefined,
      stripeChargeId: typeof invoice.charge === "string" ? invoice.charge : null,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId:
        typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
      promotionCodeId: promotionCodeIdFromAny(invoiceDiscounts ?? undefined),
    };
  }

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    const chargeDiscounts = (charge as { discounts?: Stripe.Discount[] }).discounts;
    return {
      amount: charge.amount,
      currency: charge.currency ?? "usd",
      customerEmail:
        charge.billing_details?.email ?? charge.receipt_email ?? undefined,
      stripeChargeId: charge.id,
      stripeInvoiceId: typeof charge.invoice === "string" ? charge.invoice : null,
      stripePaymentIntentId:
        typeof charge.payment_intent === "string" ? charge.payment_intent : null,
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
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
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
      { status: 500 },
    );
  }

  const verifier = new Stripe(
    process.env.PLATFORM_STRIPE_SECRET_KEY ?? "sk_test_placeholder",
    {},
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
      { status: 400 },
    );
  }

  if (event.type === "balance.available") {
    const result = await processPendingTransfers();
    return NextResponse.json({ received: true, retried: result });
  }

  const accountId = event.account ?? null;
  let projectMatch = accountId
    ? await prisma.project.findFirst({
        where: { creatorStripeAccountId: accountId },
        select: {
          id: true,
        },
      })
    : null;

  if (!projectMatch) {
    const projectId = extractProjectId(event);
    if (projectId) {
      projectMatch = await prisma.project.findFirst({
        where: { id: projectId },
        select: {
          id: true,
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
      { status: 400 },
    );
  }

  const existing = await prisma.purchase.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    console.log(`Duplicate event received: ${event.id}`);
    return NextResponse.json({ received: true });
  }

  const details = parseEventDetails(event);
  if (!details) {
    return NextResponse.json({ received: true });
  }

  const orConditions = [
    details.stripeChargeId
      ? { stripeChargeId: details.stripeChargeId }
      : null,
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
    console.log("Checking for duplicate purchase with conditions:", orConditions);
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

  let transferId: string | null = null;
  let status: "PENDING" | "PAID" | "FAILED" = coupon ? "PENDING" : "PAID";

  if (coupon && commissionAmount <= 0) {
    status = "PAID";
  }

  if (coupon && commissionAmount > 0) {
    console.log(
      `Processing commission transfer of ${commissionAmount} ${details.currency} to marketer ${coupon.marketer.id}`,
    );
    const marketerAccountId = coupon.marketer.stripeConnectedAccountId;
    if (!marketerAccountId) {
      status = "FAILED";
    } else {
      try {
        const stripe = platformStripe();

        const transfer = await stripe.transfers.create({
          amount: commissionAmount,
          currency: details.currency,
          destination: marketerAccountId,
          metadata: {
            projectId: projectMatch.id,
            couponId: coupon.id,
            eventId: event.id,
          },
        });

        transferId = transfer.id;
        status = "PAID";
      } catch (error) {
        console.error("Error processing commission transfer:", error);
        status = "FAILED";
      }
    }
  }

  console.log(`Creating purchase record for event ${event.id}`);
  await prisma.purchase.create({
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
      status,
    },
  });

  return NextResponse.json({ received: true });
}
