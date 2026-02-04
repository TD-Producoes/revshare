import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePromoCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { notificationMessages } from "@/lib/notifications/messages";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const claimInput = z.object({
  projectId: z.string().min(1),
  templateId: z.string().min(1),
  code: z.string().min(3).optional(),
});

function derivePrefix(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return sanitized.length > 0 ? sanitized : "REV";
}

export async function POST(request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const parsed = claimInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const [project, marketer, template] = await Promise.all([
    prisma.project.findUnique({
      where: { id: payload.projectId },
      select: {
        id: true,
        name: true,
        userId: true,
        creatorStripeAccountId: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, role: true, name: true },
    }),
    prisma.couponTemplate.findUnique({
      where: { id: payload.templateId },
      select: {
        id: true,
        projectId: true,
        name: true,
        percentOff: true,
        startAt: true,
        endAt: true,
        status: true,
        stripeCouponId: true,
        allowedMarketerIds: true,
      },
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
      { error: "Founder Stripe account not set" },
      { status: 400 },
    );
  }
  if (!template || template.projectId !== project.id) {
    return NextResponse.json({ error: "Coupon template not found" }, { status: 404 });
  }
  if (template.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Coupon template is not active" },
      { status: 400 },
    );
  }
  const now = new Date();
  if (template.startAt && now < template.startAt) {
    return NextResponse.json(
      { error: "Coupon template is not active yet" },
      { status: 400 },
    );
  }
  if (template.endAt && now > template.endAt) {
    return NextResponse.json(
      { error: "Coupon template has expired" },
      { status: 400 },
    );
  }
  const allowedMarketers = Array.isArray(template.allowedMarketerIds)
    ? template.allowedMarketerIds
    : [];
  if (
    allowedMarketers.length > 0 &&
    !allowedMarketers.includes(marketer.id)
  ) {
    return NextResponse.json(
      { error: "You are not allowed to claim this coupon template" },
      { status: 403 },
    );
  }

  const existingCoupon = await prisma.coupon.findFirst({
    where: {
      templateId: template.id,
      marketerId: marketer.id,
      status: "ACTIVE",
    },
    orderBy: { claimedAt: "desc" },
    select: {
      id: true,
      code: true,
      percentOff: true,
      commissionPercent: true,
      status: true,
      claimedAt: true,
      projectId: true,
      templateId: true,
    },
  });

  if (existingCoupon) {
    return NextResponse.json({ data: existingCoupon });
  }

  const contract = await prisma.contract.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: marketer.id,
      },
    },
    select: { commissionPercent: true, status: true },
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found for marketer" },
      { status: 404 },
    );
  }

  if (contract.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Contract must be approved to claim coupons" },
      { status: 403 },
    );
  }

  const stripe = platformStripe();
  const stripeAccount = project.creatorStripeAccountId;

  const code = payload.code ?? generatePromoCode(derivePrefix(template.name));

  const promotionCode = await stripe.promotionCodes.create(
    {
      promotion: {
        type: "coupon",
        coupon: template.stripeCouponId,
      },
      code,
      metadata: {
        projectId: project.id,
        templateId: template.id,
        marketerId: marketer.id,
      },
    },
    { stripeAccount },
  );

  const coupon = await prisma.$transaction(async (tx) => {
    const createdCoupon = await tx.coupon.create({
      data: {
        projectId: project.id,
        templateId: template.id,
        marketerId: marketer.id,
        code,
        stripeCouponId: template.stripeCouponId,
        stripePromotionCodeId: promotionCode.id,
        percentOff: template.percentOff,
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

    await tx.event.create({
      data: {
        type: "COUPON_CLAIMED",
        actorId: marketer.id,
        projectId: project.id,
        subjectType: "Coupon",
        subjectId: createdCoupon.id,
        data: {
          projectId: project.id,
          templateId: template.id,
          marketerId: marketer.id,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: project.userId,
        type: "SYSTEM",
        ...notificationMessages.couponClaimed(
          marketer.name ?? "A marketer",
          template.name,
          project.name,
        ),
        data: {
          projectId: project.id,
          couponId: createdCoupon.id,
          marketerId: marketer.id,
        },
      },
    });

    return createdCoupon;
  });

  return NextResponse.json({ data: coupon }, { status: 201 });
}
