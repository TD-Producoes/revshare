import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePromoCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const claimInput = z.object({
  projectId: z.string().min(1),
  marketerId: z.string().min(1),
  percentOff: z.number().int().min(1).max(100).optional(),
  code: z.string().min(3).optional(),
});

function derivePrefix(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return sanitized.length > 0 ? sanitized : "REV";
}

export async function POST(request: Request) {
  const parsed = claimInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const [project, marketer] = await Promise.all([
    prisma.project.findUnique({
      where: { id: payload.projectId },
      select: {
        id: true,
        name: true,
        creatorStripeAccountId: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: payload.marketerId },
      select: { id: true, role: true },
    }),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }
  if (!project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Creator Stripe account not set" },
      { status: 400 },
    );
  }

  const contract = await prisma.contract.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: marketer.id,
      },
    },
    select: { commissionPercent: true },
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found for marketer" },
      { status: 404 },
    );
  }

  const stripe = platformStripe();
  const stripeAccount = project.creatorStripeAccountId;

  const percentOff = payload.percentOff ?? 10;
  const code = payload.code ?? generatePromoCode(derivePrefix(project.name));

  const stripeCoupon = await stripe.coupons.create(
    {
      percent_off: percentOff,
      duration: "once",
      metadata: {
        projectId: project.id,
        marketerId: marketer.id,
      },
    },
    { stripeAccount },
  );

  const promotionCode = await stripe.promotionCodes.create(
    {
      promotion: {
        type: "coupon",
        coupon: stripeCoupon.id,
      },
      code,
      metadata: {
        projectId: project.id,
        marketerId: marketer.id,
      },
    },
    { stripeAccount },
  );

  const coupon = await prisma.coupon.create({
    data: {
      projectId: project.id,
      marketerId: marketer.id,
      code,
      stripeCouponId: stripeCoupon.id,
      stripePromotionCodeId: promotionCode.id,
      percentOff,
      commissionPercent: contract.commissionPercent.toString(),
    },
    select: {
      id: true,
      code: true,
      percentOff: true,
      commissionPercent: true,
      status: true,
      claimedAt: true,
    },
  });

  return NextResponse.json({ data: coupon }, { status: 201 });
}
