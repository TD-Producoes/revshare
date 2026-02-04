import { NextResponse } from "next/server";
import { EventType, VisibilityMode, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { markIntentExecuted, verifyIntent } from "@/lib/revclaw/intent-auth";
import { revclawPlanSchema, type RevclawPlanJson } from "@/lib/revclaw/plan";

function normalizePercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value > 1) return value / 100;
  return value;
}

function buildRewardLabel(payload: {
  rewardType: string;
  rewardPercentOff?: number | null;
  rewardDurationMonths?: number | null;
  rewardAmount?: number | null;
}) {
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
 * POST /api/revclaw/plans/:id/execute
 *
 * Executes an approved plan.
 * Requires:
 * - Authorization: Bearer <access_token>
 * - X-RevClaw-Intent-Id: approved intent of kind PLAN_EXECUTE
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);

    const intentId = request.headers.get("X-RevClaw-Intent-Id");
    if (!intentId) {
      return NextResponse.json(
        { error: "Missing X-RevClaw-Intent-Id" },
        { status: 400 },
      );
    }

    const { id } = await params;
    const plan = await prisma.revclawPlan.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        planJson: true,
        planHash: true,
        installationId: true,
        userId: true,
        executeIntentId: true,
        executionResult: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.userId !== agent.userId || plan.installationId !== agent.installationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (plan.status === "CANCELED") {
      return NextResponse.json({ error: "Plan canceled" }, { status: 400 });
    }

    if (plan.status === "EXECUTED") {
      return NextResponse.json(
        { error: "Plan already executed", execution: plan.executionResult },
        { status: 200 },
      );
    }

    // Verify intent matches plan
    const verified = await verifyIntent(
      intentId,
      agent.installationId,
      "PLAN_EXECUTE",
      { plan_id: plan.id, plan_hash: plan.planHash, plan_json: plan.planJson },
    );

    if (!verified.valid) {
      return NextResponse.json(
        { error: verified.error, code: verified.code },
        { status: 403 },
      );
    }

    const parsedPlan = revclawPlanSchema.safeParse(plan.planJson);
    if (!parsedPlan.success) {
      return NextResponse.json(
        { error: "Invalid plan_json", details: parsedPlan.error.flatten() },
        { status: 400 },
      );
    }

    const planJson = parsedPlan.data as RevclawPlanJson;

    // Require scopes based on plan contents
    requireScope(agent, "projects:draft_write");
    if ((planJson.rewards ?? []).length > 0) {
      requireScope(agent, "rewards:write");
    }
    if ((planJson.couponTemplates ?? []).length > 0) {
      requireScope(agent, "coupons:template_write");
    }
    if (planJson.publish?.enabled) {
      requireScope(agent, "projects:publish");
    }

    const now = new Date();

    await prisma.revclawPlan.update({
      where: { id: plan.id },
      data: { status: "EXECUTING" },
    });

    const existingExecution =
      plan.executionResult && typeof plan.executionResult === "object"
        ? (plan.executionResult as Record<string, unknown>)
        : {};

    const execution: {
      started_at: string;
      project_id?: string;
      steps: Array<Record<string, unknown>>;
      pending?: string[];
    } = {
      started_at:
        typeof existingExecution.started_at === "string"
          ? existingExecution.started_at
          : now.toISOString(),
      project_id:
        typeof existingExecution.project_id === "string"
          ? existingExecution.project_id
          : undefined,
      steps: Array.isArray(existingExecution.steps)
        ? (existingExecution.steps as Array<Record<string, unknown>>)
        : [],
      pending: Array.isArray(existingExecution.pending)
        ? (existingExecution.pending as string[])
        : [],
    };

    const hasStep = (predicate: (s: Record<string, unknown>) => boolean) =>
      execution.steps.some(predicate);

    // Step 1: create draft project (idempotent)
    let projectId = execution.project_id;
    if (!projectId) {
      const createdProject = await prisma.project.create({
      data: {
        userId: agent.userId,
        name: planJson.project.name,
        description: planJson.project.description ?? undefined,
        category: planJson.project.category ?? undefined,
        website: planJson.project.website ?? undefined,
        country: planJson.project.country ?? undefined,
        refundWindowDays: planJson.project.refundWindowDays ?? undefined,
        marketerCommissionPercent:
          normalizePercent(planJson.project.marketerCommissionPercent) ?? undefined,
        platformCommissionPercent:
          normalizePercent(planJson.project.platformCommissionPercent) ?? undefined,
        visibility: VisibilityMode.PRIVATE,
      },
      select: { id: true, name: true, creatorStripeAccountId: true },
    });

      projectId = createdProject.id;
      execution.project_id = createdProject.id;

      execution.steps.push({
        kind: "project.create",
        status: "ok",
        project_id: createdProject.id,
      });

      await emitRevclawEvent({
        type: EventType.PROJECT_CREATED,
        agentId: agent.agentId,
        userId: agent.userId,
        projectId: createdProject.id,
        subjectType: "Project",
        subjectId: createdProject.id,
        installationId: agent.installationId,
        intentId,
        initiatedBy: "agent",
        data: { projectId: createdProject.id, name: createdProject.name },
      });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        creatorStripeAccountId: true,
        visibility: true,
        userId: true,
      },
    });

    if (!project || project.userId !== agent.userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Step 2: rewards (draft) (idempotent by client_ref)
    for (const reward of planJson.rewards ?? []) {
      const already = hasStep(
        (s) => s.kind === "reward.create" && s.client_ref === reward.client_ref && s.status === "ok",
      );
      if (already) continue;
      const { date: startsAtInput, valid: startsAtValid } = parseOptionalDate(
        reward.startsAt,
      );
      if (!startsAtValid) {
        execution.steps.push({
          kind: "reward.create",
          status: "error",
          client_ref: reward.client_ref,
          error: "Invalid startsAt date",
        });
        continue;
      }

      // enforce invariants similar to /api/projects/:id/rewards
      if (reward.availabilityType === "FIRST_N" && !reward.availabilityLimit) {
        execution.steps.push({
          kind: "reward.create",
          status: "error",
          client_ref: reward.client_ref,
          error: "availabilityLimit is required when availabilityType=FIRST_N",
        });
        continue;
      }

      if (reward.rewardType === "DISCOUNT_COUPON" && !(reward.rewardPercentOff && reward.rewardPercentOff > 0)) {
        execution.steps.push({
          kind: "reward.create",
          status: "error",
          client_ref: reward.client_ref,
          error: "rewardPercentOff is required for discount rewards",
        });
        continue;
      }

      if (reward.rewardType === "FREE_SUBSCRIPTION" && !(reward.rewardDurationMonths && reward.rewardDurationMonths > 0)) {
        execution.steps.push({
          kind: "reward.create",
          status: "error",
          client_ref: reward.client_ref,
          error: "rewardDurationMonths is required for free subscription rewards",
        });
        continue;
      }

      if (reward.rewardType === "MONEY" && !(reward.rewardAmount && reward.rewardAmount > 0)) {
        execution.steps.push({
          kind: "reward.create",
          status: "error",
          client_ref: reward.client_ref,
          error: "rewardAmount is required for cash rewards",
        });
        continue;
      }

      const startsAt = startsAtInput ?? new Date();

      const created = await prisma.reward.create({
        data: {
          projectId: project.id,
          name: reward.name,
          description: reward.description ?? undefined,
          milestoneType: reward.milestoneType,
          milestoneValue: reward.milestoneValue,
          startsAt,
          rewardType: reward.rewardType,
          rewardLabel: buildRewardLabel(reward),
          rewardPercentOff:
            reward.rewardType === "DISCOUNT_COUPON" ? reward.rewardPercentOff ?? null : null,
          rewardDurationMonths:
            reward.rewardType === "FREE_SUBSCRIPTION" ? reward.rewardDurationMonths ?? null : null,
          rewardAmount: reward.rewardType === "MONEY" ? reward.rewardAmount ?? null : null,
          rewardCurrency: reward.rewardType === "MONEY" ? ("USD") : null,
          allowedMarketerIds: reward.allowedMarketerIds ?? [],
          fulfillmentType: reward.rewardType === "MONEY" ? "MANUAL" : reward.fulfillmentType,
          earnLimit: reward.earnLimit,
          availabilityType: reward.availabilityType,
          availabilityLimit:
            reward.availabilityType === "FIRST_N" ? reward.availabilityLimit ?? null : null,
          visibility: reward.visibility,
          status: "DRAFT",
        },
        select: { id: true, name: true },
      });

      execution.steps.push({
        kind: "reward.create",
        status: "ok",
        client_ref: reward.client_ref,
        reward_id: created.id,
      });

      await emitRevclawEvent({
        type: EventType.REWARD_CREATED,
        agentId: agent.agentId,
        userId: agent.userId,
        projectId: project.id,
        subjectType: "Reward",
        subjectId: created.id,
        installationId: agent.installationId,
        intentId,
        initiatedBy: "agent",
        data: { rewardId: created.id, rewardName: created.name },
      });
    }

    // Step 3: coupon templates + publish (after Stripe connected)
    const needsStripe =
      (planJson.couponTemplates ?? []).length > 0 || !!planJson.publish?.enabled;

    if (needsStripe && !project.creatorStripeAccountId) {
      if (!execution.pending?.includes("stripe_connect")) {
        execution.pending = [...(execution.pending ?? []), "stripe_connect"];
      }
      execution.steps.push({
        kind: "stripe.connect",
        status: "blocked",
        reason: "stripe_not_connected",
        message:
          "Connect Stripe in the dashboard, then call execute again with the same plan + intent to continue (coupon templates + publish).",
        stripe_connect_url: `/founder/projects/${project.id}?dialog=stripe`,
      });

      await prisma.revclawPlan.update({
        where: { id: plan.id },
        data: {
          status: "EXECUTING",
          executionResult: execution as Prisma.JsonObject,
        },
      });

      return NextResponse.json(
        {
          data: {
            plan_id: plan.id,
            project_id: project.id,
            execution,
            next_action: {
              type: "stripe_connect",
              url: `/founder/projects/${project.id}?dialog=stripe`,
            },
          },
        },
        { status: 200 },
      );
    }

    // Stripe is connected: clear pending flag
    if (execution.pending?.includes("stripe_connect")) {
      execution.pending = execution.pending.filter((p) => p !== "stripe_connect");
    }

    // Stripe is connected: execute coupon templates
    // NOTE: We create Stripe coupons directly here, using the same connected account.
    if ((planJson.couponTemplates ?? []).length > 0) {
      const { platformStripe } = await import("@/lib/stripe");
      const stripe = platformStripe();
      const stripeAccount = project.creatorStripeAccountId!;

      for (const t of planJson.couponTemplates ?? []) {
        const already = hasStep(
          (s) =>
            s.kind === "couponTemplate.create" &&
            s.client_ref === t.client_ref &&
            s.status === "ok",
        );
        if (already) continue;

        const durationType = t.durationType ?? "ONCE";
        const durationInMonths =
          durationType === "REPEATING" ? t.durationInMonths ?? undefined : undefined;

        const endAt = t.endAt ? new Date(t.endAt) : null;

        const stripeCoupon = await stripe.coupons.create(
          {
            percent_off: t.percentOff,
            duration: durationType === "REPEATING" ? "repeating" : "once",
            ...(durationType === "REPEATING" && durationInMonths
              ? { duration_in_months: durationInMonths }
              : {}),
            ...(t.maxRedemptions ? { max_redemptions: t.maxRedemptions } : {}),
            ...(endAt ? { redeem_by: Math.floor(endAt.getTime() / 1000) } : {}),
            metadata: {
              projectId: project.id,
              clientRef: t.client_ref,
            },
          },
          { stripeAccount },
        );

        const template = await prisma.couponTemplate.create({
          data: {
            projectId: project.id,
            name: t.name,
            description: t.description ?? undefined,
            percentOff: t.percentOff,
            durationType,
            durationInMonths: durationType === "REPEATING" ? durationInMonths ?? null : null,
            startAt: t.startAt ? new Date(t.startAt) : null,
            endAt: endAt,
            maxRedemptions: t.maxRedemptions ?? null,
            productIds: [],
            allowedMarketerIds: [],
            stripeCouponId: stripeCoupon.id,
            status: "ACTIVE",
          },
          select: { id: true, name: true, percentOff: true },
        });

        execution.steps.push({
          kind: "couponTemplate.create",
          status: "ok",
          client_ref: t.client_ref,
          couponTemplateId: template.id,
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
      }
    }

    // Publish (after Stripe is connected)
    if (planJson.publish?.enabled && project.visibility !== VisibilityMode.PUBLIC) {
      const updated = await prisma.project.update({
        where: { id: project.id },
        data: { visibility: VisibilityMode.PUBLIC },
        select: { id: true, visibility: true },
      });

      execution.steps.push({
        kind: "project.publish",
        status: "ok",
        project_id: updated.id,
        visibility: updated.visibility,
      });

      await emitRevclawEvent({
        type: EventType.PROJECT_UPDATED,
        agentId: agent.agentId,
        userId: agent.userId,
        projectId: updated.id,
        subjectType: "Project",
        subjectId: updated.id,
        installationId: agent.installationId,
        intentId,
        initiatedBy: "agent",
        data: { action: "publish", visibility: updated.visibility },
      });
    }

    // Finished
    await prisma.revclawPlan.update({
      where: { id: plan.id },
      data: {
        status: "EXECUTED",
        executedAt: new Date(),
        executionResult: execution as Prisma.JsonObject,
      },
    });

    await markIntentExecuted(intentId, {
      success: true,
      data: { planId: plan.id, projectId: project.id },
    });

    return NextResponse.json(
      { data: { plan_id: plan.id, project_id: project.id, execution } },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
