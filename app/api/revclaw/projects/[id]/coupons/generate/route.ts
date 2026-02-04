import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";
import { generatePromoCode } from "@/lib/codes";
import { platformStripe } from "@/lib/stripe";

const schema = z.object({
  templateId: z.string().min(1),
  code: z.string().min(3).optional().nullable(),
});

function derivePrefix(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return sanitized.length > 0 ? sanitized : "REV";
}

/**
 * POST /api/revclaw/projects/:id/coupons/generate
 *
 * Creates an additional coupon code for the same coupon template.
 * This is useful for rotation, channel-specific codes, or multiple promos.
 *
 * Requires an approved contract.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "coupons:claim");

    const { id: projectId } = await params;

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    const [project, marketer, template, contract] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          creatorStripeAccountId: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: agent.userId },
        select: { id: true, role: true },
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
      prisma.contract.findUnique({
        where: { projectId_userId: { projectId, userId: agent.userId } },
        select: { commissionPercent: true, status: true },
      }),
    ]);

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!marketer || marketer.role !== "marketer") {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }
    if (!project.creatorStripeAccountId) {
      return NextResponse.json({ error: "Founder Stripe account not set" }, { status: 400 });
    }
    if (!template || template.projectId !== project.id) {
      return NextResponse.json({ error: "Coupon template not found" }, { status: 404 });
    }
    if (!contract || contract.status !== "APPROVED") {
      return NextResponse.json({ error: "Contract must be approved to generate coupons" }, { status: 403 });
    }

    const now = new Date();
    if (template.status !== "ACTIVE") {
      return NextResponse.json({ error: "Coupon template is not active" }, { status: 400 });
    }
    if (template.startAt && now < template.startAt) {
      return NextResponse.json({ error: "Coupon template is not active yet" }, { status: 400 });
    }
    if (template.endAt && now > template.endAt) {
      return NextResponse.json({ error: "Coupon template has expired" }, { status: 400 });
    }

    const allowed = Array.isArray(template.allowedMarketerIds) ? template.allowedMarketerIds : [];
    if (allowed.length > 0 && !allowed.includes(agent.userId)) {
      return NextResponse.json({ error: "You are not allowed to claim this coupon template" }, { status: 403 });
    }

    const stripe = platformStripe();
    const stripeAccount = project.creatorStripeAccountId;

    const code = payload.code ?? generatePromoCode(derivePrefix(template.name));

    const promotionCode = await stripe.promotionCodes.create(
      {
        promotion: { type: "coupon", coupon: template.stripeCouponId },
        code,
        metadata: {
          projectId: project.id,
          templateId: template.id,
          marketerId: agent.userId,
        },
      },
      { stripeAccount },
    );

    const coupon = await prisma.coupon.create({
      data: {
        projectId: project.id,
        templateId: template.id,
        marketerId: agent.userId,
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

    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
