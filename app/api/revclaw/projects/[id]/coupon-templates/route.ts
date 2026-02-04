import { NextResponse } from "next/server";
import { z } from "zod";
import { EventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { markIntentExecuted, verifyIntent } from "@/lib/revclaw/intent-auth";

const inputSchema = z.object({
  // Optional but recommended so the human sees what they're approving.
  project_name: z.string().min(1).max(200).optional(),

  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  percentOff: z.number().int().min(1).max(100),

  durationType: z.enum(["ONCE", "REPEATING"]).optional(),
  durationInMonths: z.number().int().min(1).max(12).optional(),

  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional(),
  maxRedemptions: z.number().int().min(1).optional(),

  productIds: z.array(z.string().min(1)).optional(),
  allowedMarketerIds: z.array(z.string().min(1)).optional(),
});

/**
 * RevClaw wrapper: create a Stripe-backed coupon template for a project.
 *
 * - Requires the project founder to have connected Stripe (creatorStripeAccountId).
 * - Requires an approved intent by default (human approval), because this creates a Stripe coupon.
 * - Uses the same underlying Stripe account as the existing dashboard endpoint.
 *
 * Header:
 * - X-RevClaw-Intent-Id: <intent_id> (required)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "coupons:template_write");

    const { id: projectId } = await context.params;

    const intentId = request.headers.get("X-RevClaw-Intent-Id");
    if (!intentId) {
      return NextResponse.json(
        {
          error: "Intent required for coupon template creation",
          code: "intent_required",
          message:
            'Create an intent via POST /api/revclaw/intents with kind="COUPON_TEMPLATE_CREATE" first, then provide X-RevClaw-Intent-Id.',
        },
        { status: 403 },
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        userId: true,
        creatorStripeAccountId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!project.creatorStripeAccountId) {
      return NextResponse.json(
        { error: "Founder Stripe account not set" },
        { status: 400 },
      );
    }

    // Parse dates
    const startAt = input.startAt ? new Date(input.startAt) : null;
    const endAt = input.endAt ? new Date(input.endAt) : null;
    if (startAt && Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: "Invalid startAt date" }, { status: 400 });
    }
    if (endAt && Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Invalid endAt date" }, { status: 400 });
    }
    if (startAt && endAt && startAt > endAt) {
      return NextResponse.json(
        { error: "startAt must be before endAt" },
        { status: 400 },
      );
    }

    const durationType = input.durationType ?? "ONCE";
    const durationInMonths =
      durationType === "REPEATING" ? input.durationInMonths : undefined;

    if (durationType === "REPEATING" && !durationInMonths) {
      return NextResponse.json(
        { error: "durationInMonths is required for repeating coupons" },
        { status: 400 },
      );
    }

    // Verify intent payload hash (must match exactly what was approved)
    const payloadForIntent = {
      project_id: projectId,
      project_name: input.project_name ?? project.name,
      name: input.name,
      description: input.description ?? null,
      percentOff: input.percentOff,
      durationType,
      durationInMonths: durationType === "REPEATING" ? durationInMonths : null,
      startAt: input.startAt ?? null,
      endAt: input.endAt ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      productIds: input.productIds ?? [],
      allowedMarketerIds: input.allowedMarketerIds ?? [],
    };

    const verified = await verifyIntent(
      intentId,
      agent.installationId,
      "COUPON_TEMPLATE_CREATE",
      payloadForIntent,
    );

    if (!verified.valid) {
      return NextResponse.json(
        { error: verified.error, code: verified.code },
        { status: 403 },
      );
    }

    // Create coupon in connected Stripe account
    const stripe = platformStripe();
    const stripeAccount = project.creatorStripeAccountId;

    const stripeCoupon = await stripe.coupons.create(
      {
        percent_off: input.percentOff,
        duration: durationType === "REPEATING" ? "repeating" : "once",
        ...(durationType === "REPEATING" && durationInMonths
          ? { duration_in_months: durationInMonths }
          : {}),
        ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
        ...(endAt ? { redeem_by: Math.floor(endAt.getTime() / 1000) } : {}),
        ...(input.productIds?.length
          ? { applies_to: { products: input.productIds } }
          : {}),
        metadata: {
          projectId: project.id,
        },
      },
      { stripeAccount },
    );

    const template = await prisma.couponTemplate.create({
      data: {
        projectId: project.id,
        name: input.name,
        description: input.description,
        percentOff: input.percentOff,
        durationType,
        durationInMonths: durationType === "REPEATING" ? durationInMonths ?? null : null,
        startAt,
        endAt,
        maxRedemptions: input.maxRedemptions,
        productIds: input.productIds ?? [],
        allowedMarketerIds: input.allowedMarketerIds ?? [],
        stripeCouponId: stripeCoupon.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        percentOff: true,
        durationType: true,
        durationInMonths: true,
        startAt: true,
        endAt: true,
        maxRedemptions: true,
        status: true,
        createdAt: true,
      },
    });

    await markIntentExecuted(intentId, {
      success: true,
      data: { couponTemplateId: template.id },
    });

    await emitRevclawEvent({
      type: EventType.COUPON_TEMPLATE_CREATED,
      agentId: agent.agentId,
      userId: agent.userId,
      projectId: project.id,
      subjectType: "CouponTemplate",
      subjectId: template.id,
      installationId: agent.installationId,
      intentId,
      initiatedBy: "agent",
      data: {
        couponTemplateId: template.id,
        name: template.name,
        percentOff: template.percentOff,
      },
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
