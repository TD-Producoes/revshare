import { NextResponse } from "next/server";
import { z } from "zod";
import { EventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { markIntentExecuted, verifyIntent } from "@/lib/revclaw/intent-auth";

// Mirrors app/api/projects/[projectId]/rewards schema, but allows nulls for optional fields
const rewardInput = z.object({
  project_name: z.string().min(1).max(200).optional(),

  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),

  milestoneType: z.enum(["NET_REVENUE", "COMPLETED_SALES", "ACTIVE_CUSTOMERS"]),
  milestoneValue: z.number().int().min(1),
  startsAt: z.string().optional().nullable(),

  rewardType: z.enum([
    "DISCOUNT_COUPON",
    "FREE_SUBSCRIPTION",
    "PLAN_UPGRADE",
    "ACCESS_PERK",
    "MONEY",
  ]),

  rewardPercentOff: z.number().int().min(1).max(100).optional().nullable(),
  rewardDurationMonths: z.number().int().min(1).max(12).optional().nullable(),
  rewardAmount: z.number().int().min(1).optional().nullable(),

  fulfillmentType: z.enum(["AUTO_COUPON", "MANUAL"]),
  earnLimit: z.enum(["ONCE_PER_MARKETER", "MULTIPLE"]),

  availabilityType: z.enum(["UNLIMITED", "FIRST_N"]),
  availabilityLimit: z.number().int().min(1).optional().nullable(),

  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  allowedMarketerIds: z.array(z.string().min(1)).optional().nullable(),
});

function buildRewardLabel(payload: z.infer<typeof rewardInput>) {
  if (payload.rewardType === "DISCOUNT_COUPON") {
    return `${payload.rewardPercentOff ?? 0}% discount`;
  }
  if (payload.rewardType === "FREE_SUBSCRIPTION") {
    const months = payload.rewardDurationMonths ?? 1;
    return `Free ${months} month${months === 1 ? "" : "s"}`;
  }
  if (payload.rewardType === "PLAN_UPGRADE") {
    return "Plan upgrade";
  }
  if (payload.rewardType === "MONEY") {
    const amount = payload.rewardAmount ?? 0;
    return `Cash reward ${Math.round(amount) / 100}`;
  }
  return "Access / perk";
}

function parseOptionalDate(value?: string | null) {
  if (!value) return { date: null, valid: true };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: null, valid: false };
  return { date, valid: true };
}

/**
 * RevClaw wrapper: create a reward (DRAFT) for a project.
 *
 * Requires:
 * - scope: rewards:write
 * - approved intent (REWARD_CREATE)
 * - X-RevClaw-Intent-Id header
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "rewards:write");

    const { id: projectId } = await context.params;

    const intentId = request.headers.get("X-RevClaw-Intent-Id");
    if (!intentId) {
      return NextResponse.json(
        {
          error: "Intent required for reward creation",
          code: "intent_required",
          message:
            'Create an intent via POST /api/revclaw/intents with kind="REWARD_CREATE" first, then provide X-RevClaw-Intent-Id.',
        },
        { status: 403 },
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = rewardInput.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, name: true, currency: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate reward-specific requirements (mirrors existing endpoint)
    if (
      input.availabilityType === "FIRST_N" &&
      (!input.availabilityLimit || input.availabilityLimit < 1)
    ) {
      return NextResponse.json(
        { error: "availabilityLimit is required when availability is capped" },
        { status: 400 },
      );
    }

    if (input.rewardType === "DISCOUNT_COUPON" && (input.rewardPercentOff ?? 0) < 1) {
      return NextResponse.json(
        { error: "rewardPercentOff is required for discount rewards" },
        { status: 400 },
      );
    }

    if (
      input.rewardType === "FREE_SUBSCRIPTION" &&
      (!input.rewardDurationMonths || input.rewardDurationMonths < 1)
    ) {
      return NextResponse.json(
        {
          error: "rewardDurationMonths is required for free subscription rewards",
        },
        { status: 400 },
      );
    }

    if (input.rewardType === "MONEY" && (!input.rewardAmount || input.rewardAmount < 1)) {
      return NextResponse.json(
        { error: "rewardAmount is required for cash rewards" },
        { status: 400 },
      );
    }

    const { date: startsAtInput, valid: startsAtValid } = parseOptionalDate(input.startsAt);
    if (!startsAtValid) {
      return NextResponse.json({ error: "Invalid startsAt date" }, { status: 400 });
    }

    const startsAt = startsAtInput ?? new Date();

    // Verify intent payload hash
    const payloadForIntent = {
      project_id: projectId,
      project_name: input.project_name ?? project.name,
      name: input.name,
      description: input.description ?? null,
      milestoneType: input.milestoneType,
      milestoneValue: input.milestoneValue,
      startsAt: input.startsAt ?? null,
      rewardType: input.rewardType,
      rewardPercentOff: input.rewardPercentOff ?? null,
      rewardDurationMonths: input.rewardDurationMonths ?? null,
      rewardAmount: input.rewardAmount ?? null,
      fulfillmentType: input.rewardType === "MONEY" ? "MANUAL" : input.fulfillmentType,
      earnLimit: input.earnLimit,
      availabilityType: input.availabilityType,
      availabilityLimit:
        input.availabilityType === "FIRST_N" ? input.availabilityLimit ?? null : null,
      visibility: input.visibility,
      allowedMarketerIds: input.allowedMarketerIds ?? [],
    };

    const verified = await verifyIntent(
      intentId,
      agent.installationId,
      "REWARD_CREATE",
      payloadForIntent,
    );

    if (!verified.valid) {
      return NextResponse.json(
        { error: verified.error, code: verified.code },
        { status: 403 },
      );
    }

    const reward = await prisma.reward.create({
      data: {
        projectId: project.id,
        name: input.name,
        description: input.description ?? undefined,
        milestoneType: input.milestoneType,
        milestoneValue: input.milestoneValue,
        startsAt,
        rewardType: input.rewardType,
        rewardLabel: buildRewardLabel(input),
        rewardPercentOff: input.rewardType === "DISCOUNT_COUPON" ? input.rewardPercentOff ?? null : null,
        rewardDurationMonths: input.rewardType === "FREE_SUBSCRIPTION" ? input.rewardDurationMonths ?? null : null,
        rewardAmount: input.rewardType === "MONEY" ? input.rewardAmount ?? null : null,
        rewardCurrency: input.rewardType === "MONEY" ? (project.currency ?? "USD") : null,
        allowedMarketerIds: input.allowedMarketerIds ?? [],
        fulfillmentType: input.rewardType === "MONEY" ? "MANUAL" : input.fulfillmentType,
        earnLimit: input.earnLimit,
        availabilityType: input.availabilityType,
        availabilityLimit:
          input.availabilityType === "FIRST_N" ? input.availabilityLimit ?? null : null,
        visibility: input.visibility,
        status: "DRAFT",
      },
      select: {
        id: true,
        name: true,
        status: true,
        milestoneType: true,
        milestoneValue: true,
        rewardType: true,
        rewardLabel: true,
        createdAt: true,
      },
    });

    await prisma.event.create({
      data: {
        type: EventType.REWARD_CREATED,
        actorId: agent.userId,
        projectId: project.id,
        subjectType: "Reward",
        subjectId: reward.id,
        data: {
          rewardId: reward.id,
          rewardName: reward.name,
          status: reward.status,
          revclaw: {
            agentId: agent.agentId,
            installationId: agent.installationId,
            intentId,
            initiatedBy: "agent",
          },
        },
      },
    });

    await markIntentExecuted(intentId, { success: true, data: { rewardId: reward.id } });

    // Also emit a stable RevClaw event for audit UX
    await emitRevclawEvent({
      type: EventType.REWARD_CREATED,
      agentId: agent.agentId,
      userId: agent.userId,
      projectId: project.id,
      subjectType: "Reward",
      subjectId: reward.id,
      installationId: agent.installationId,
      intentId,
      initiatedBy: "agent",
      data: {
        rewardId: reward.id,
        name: reward.name,
        status: reward.status,
      },
    });

    return NextResponse.json({ data: reward }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
