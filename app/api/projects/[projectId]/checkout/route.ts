import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const checkoutInput = z.object({
  priceId: z.string().min(1),
  quantity: z.number().int().min(1).max(100).optional(),
  customerId: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  promotionCode: z.string().min(1).optional(),
  allowPromotionCodes: z.boolean().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

function defaultUrl(path: string) {
  return `${process.env.BASE_URL}${path}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const parsed = checkoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      creatorStripeAccountId: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Creator Stripe account not set" },
      { status: 400 }
    );
  }

  const stripe = platformStripe();
  const stripeAccount = project.creatorStripeAccountId;

  let promotionCodeId: string | undefined;
  if (payload.promotionCode) {
    if (payload.promotionCode.startsWith("promo_")) {
      promotionCodeId = payload.promotionCode;
    } else {
      const list = await stripe.promotionCodes.list(
        {
          code: payload.promotionCode,
          active: true,
          limit: 1,
        },
        { stripeAccount }
      );
      if (list.data.length === 0) {
        return NextResponse.json(
          { error: "Promotion code not found" },
          { status: 404 }
        );
      }
      promotionCodeId = list.data[0].id;
    }
  }

  const successUrl =
    payload.successUrl ??
    process.env.CHECKOUT_SUCCESS_URL ??
    defaultUrl("/?checkout=success");
  const cancelUrl =
    payload.cancelUrl ??
    process.env.CHECKOUT_CANCEL_URL ??
    defaultUrl("/?checkout=cancel");

  const price = await stripe.prices.retrieve(payload.priceId, {
    stripeAccount,
  });
  const mode = price.type === "recurring" ? "subscription" : "payment";
  const platformCommissionPercent = Number(project.platformCommissionPercent);
  const marketerCommissionPercent = Number(project.marketerCommissionPercent);
  const totalCommissionPercent =
    platformCommissionPercent + marketerCommissionPercent;
  const hasPromotion = Boolean(promotionCodeId);
  const quantity = payload.quantity ?? 1;
  const baseAmount = (price.unit_amount ?? 0) * quantity;
  let discountedAmount = baseAmount;

  if (promotionCodeId) {
    const promoResponse = await stripe.promotionCodes.retrieve(
      promotionCodeId,
      { expand: ["coupon"] },
      { stripeAccount }
    );

    const promo = promoResponse as unknown as Stripe.PromotionCode & {
      coupon: string | Stripe.Coupon | null;
    };
    const coupon =
      typeof promo.coupon === "string" ? null : promo.coupon ?? null;
    if (coupon?.percent_off) {
      discountedAmount = Math.round(
        baseAmount * (1 - coupon.percent_off / 100)
      );
    } else if (coupon?.amount_off) {
      discountedAmount = Math.max(0, baseAmount - coupon.amount_off * quantity);
    }
  }

  const applicationFeeAmount = hasPromotion
    ? Math.round(discountedAmount * totalCommissionPercent)
    : 0;

  const session = await stripe.checkout.sessions.create(
    {
      mode,
      line_items: [
        {
          price: payload.priceId,
          quantity: payload.quantity ?? 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(payload.customerId
        ? { customer: payload.customerId }
        : payload.customerEmail
        ? { customer_email: payload.customerEmail }
        : {}),
      ...(payload.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : {}),
      metadata: {
        projectId,
      },
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata: { projectId },
              ...(hasPromotion
                ? { application_fee_percent: totalCommissionPercent * 100 }
                : {}),
            },
          }
        : {
            payment_intent_data: {
              metadata: { projectId },
              ...(hasPromotion
                ? { application_fee_amount: applicationFeeAmount }
                : {}),
            },
          }),
      client_reference_id: projectId,
    },
    { stripeAccount }
  );

  return NextResponse.json({
    data: {
      id: session.id,
      url: session.url,
    },
  });
}
