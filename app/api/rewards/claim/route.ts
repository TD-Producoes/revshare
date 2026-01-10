import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePromoCode } from "@/lib/codes";
import { notificationMessages } from "@/lib/notifications/messages";
import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const claimInput = z.object({
  rewardEarnedId: z.string().min(1),
  marketerId: z.string().min(1),
  code: z.string().min(3).optional(),
});

function derivePrefix(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return sanitized.length > 0 ? sanitized : "REWARD";
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
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, payload.marketerId);
  } catch (error) {
    return authErrorResponse(error);
  }

  const rewardEarned = await prisma.rewardEarned.findUnique({
    where: { id: payload.rewardEarnedId },
    select: {
      id: true,
      status: true,
      rewardId: true,
      projectId: true,
      marketerId: true,
      rewardCoupon: {
        select: {
          id: true,
          code: true,
          stripeCouponId: true,
          stripePromotionCodeId: true,
        },
      },
      reward: {
        select: {
          id: true,
          name: true,
          rewardType: true,
          rewardPercentOff: true,
          rewardDurationMonths: true,
          fulfillmentType: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          userId: true,
          creatorStripeAccountId: true,
        },
      },
      marketer: {
        select: { id: true, role: true, name: true },
      },
    },
  });

  if (!rewardEarned) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }
  if (rewardEarned.marketerId !== payload.marketerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!rewardEarned.marketer || rewardEarned.marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }
  if (rewardEarned.rewardCoupon) {
    return NextResponse.json({ data: rewardEarned.rewardCoupon });
  }
  if (rewardEarned.status !== "UNLOCKED") {
    return NextResponse.json(
      { error: "Reward is not claimable yet." },
      { status: 400 },
    );
  }

  const { reward } = rewardEarned;
  if (!reward) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }

  if (reward.fulfillmentType === "MANUAL") {
    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.rewardEarned.update({
        where: { id: rewardEarned.id },
        data: { status: "CLAIMED", claimedAt: new Date() },
      });

      const event = await tx.event.create({
        data: {
          type: "REWARD_CLAIMED",
          actorId: rewardEarned.marketerId,
          projectId: rewardEarned.projectId,
          subjectType: "RewardEarned",
          subjectId: rewardEarned.id,
          data: {
            rewardId: rewardEarned.rewardId,
            rewardEarnedId: rewardEarned.id,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: rewardEarned.project.userId,
          eventId: event.id,
          type: "SYSTEM",
          ...notificationMessages.rewardClaimed(
            rewardEarned.marketer.name ?? "A marketer",
            reward.name,
            rewardEarned.project.name,
          ),
          data: {
            rewardId: reward.id,
            rewardEarnedId: rewardEarned.id,
            marketerId: rewardEarned.marketerId,
            projectId: rewardEarned.projectId,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: rewardEarned.marketerId,
          eventId: event.id,
          type: "SYSTEM",
          ...notificationMessages.rewardClaimedMarketer(
            reward.name,
            rewardEarned.project.name,
          ),
          data: {
            rewardId: reward.id,
            rewardEarnedId: rewardEarned.id,
            marketerId: rewardEarned.marketerId,
            projectId: rewardEarned.projectId,
          },
        },
      });

      return claimed;
    });

    return NextResponse.json({ data: updated });
  }

  if (
    reward.rewardType !== "DISCOUNT_COUPON" &&
    reward.rewardType !== "FREE_SUBSCRIPTION"
  ) {
    return NextResponse.json(
      { error: "This reward requires manual fulfillment." },
      { status: 400 },
    );
  }
  if (!rewardEarned.project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Founder Stripe account not set" },
      { status: 400 },
    );
  }

  const stripe = platformStripe();
  const stripeAccount = rewardEarned.project.creatorStripeAccountId;
  const code = payload.code ?? generatePromoCode(derivePrefix(reward.name));

  const couponPayload =
    reward.rewardType === "DISCOUNT_COUPON"
      ? {
          percent_off: reward.rewardPercentOff ?? 0,
          duration: "once" as const,
        }
      : {
          percent_off: 100,
          duration: "repeating" as const,
          duration_in_months: reward.rewardDurationMonths ?? 1,
        };

  if (!couponPayload.percent_off || couponPayload.percent_off < 1) {
    return NextResponse.json(
      { error: "Reward discount is not configured." },
      { status: 400 },
    );
  }

  const stripeCoupon = await stripe.coupons.create(couponPayload, {
    stripeAccount,
  });

  const promotionCode = await stripe.promotionCodes.create(
    {
      promotion: {
        type: "coupon",
        coupon: stripeCoupon.id,
      },
      code,
      metadata: {
        projectId: rewardEarned.projectId,
        rewardId: reward.id,
        rewardEarnedId: rewardEarned.id,
        marketerId: rewardEarned.marketerId,
      },
    },
    { stripeAccount },
  );

  const rewardCoupon = await prisma.$transaction(async (tx) => {
    const createdCoupon = await tx.rewardCoupon.create({
      data: {
        rewardEarnedId: rewardEarned.id,
        projectId: rewardEarned.projectId,
        marketerId: rewardEarned.marketerId,
        stripeCouponId: stripeCoupon.id,
        stripePromotionCodeId: promotionCode.id,
        code,
      },
      select: {
        id: true,
        code: true,
        stripeCouponId: true,
        stripePromotionCodeId: true,
      },
    });

    await tx.rewardEarned.update({
      where: { id: rewardEarned.id },
      data: { status: "CLAIMED", claimedAt: new Date() },
    });

    const event = await tx.event.create({
      data: {
        type: "REWARD_CLAIMED",
        actorId: rewardEarned.marketerId,
        projectId: rewardEarned.projectId,
        subjectType: "RewardEarned",
        subjectId: rewardEarned.id,
        data: {
          rewardId: reward.id,
          rewardEarnedId: rewardEarned.id,
          rewardCouponId: createdCoupon.id,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: rewardEarned.project.userId,
        eventId: event.id,
        type: "SYSTEM",
        ...notificationMessages.rewardClaimed(
          rewardEarned.marketer.name ?? "A marketer",
          reward.name,
          rewardEarned.project.name,
        ),
        data: {
          rewardId: reward.id,
          rewardEarnedId: rewardEarned.id,
          rewardCouponId: createdCoupon.id,
          marketerId: rewardEarned.marketerId,
          projectId: rewardEarned.projectId,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: rewardEarned.marketerId,
        eventId: event.id,
        type: "SYSTEM",
        ...notificationMessages.rewardClaimedMarketer(
          reward.name,
          rewardEarned.project.name,
        ),
        data: {
          rewardId: reward.id,
          rewardEarnedId: rewardEarned.id,
          rewardCouponId: createdCoupon.id,
          marketerId: rewardEarned.marketerId,
          projectId: rewardEarned.projectId,
        },
      },
    });

    return createdCoupon;
  });

  return NextResponse.json({ data: rewardCoupon }, { status: 201 });
}
