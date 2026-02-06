import { NextResponse } from "next/server";
import { EventType, VisibilityMode, Prisma } from "@prisma/client";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { markIntentExecuted, verifyIntent } from "@/lib/revclaw/intent-auth";
import { revclawPlanSchema, type RevclawPlanJson } from "@/lib/revclaw/plan";
import { generatePromoCode } from "@/lib/codes";
import { platformStripe } from "@/lib/stripe";
import {
  checkRateLimit,
  rateLimitResponse,
  PLAN_EXECUTE_LIMIT,
} from "@/lib/revclaw/rate-limit";

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

function derivePrefix(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return sanitized.length > 0 ? sanitized : "REV";
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

    // Rate limit per installation
    const rl = checkRateLimit(`plan_exec:${agent.installationId}`, PLAN_EXECUTE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds!);

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

    // MARKETER_PROMO_PLAN / MARKETER_BATCH_PROMO_PLAN execution (apply → coupon → attribution → promo drafts)
    if (planJson.kind === "MARKETER_PROMO_PLAN" || planJson.kind === "MARKETER_BATCH_PROMO_PLAN") {
      const items =
        planJson.kind === "MARKETER_BATCH_PROMO_PLAN"
          ? planJson.items
          : [
              {
                project: planJson.project,
                application: planJson.application,
                coupon: planJson.coupon,
                promo: planJson.promo,
                notes: planJson.notes,
              },
            ];
      requireScope(agent, "applications:submit");
      requireScope(agent, "coupons:claim");
      requireScope(agent, "projects:read");
      requireScope(agent, "outreach:draft");

      const now = new Date();

      await prisma.revclawPlan.update({ where: { id: plan.id }, data: { status: "EXECUTING" } });

      const execution: {
        started_at: string;
        items: Array<{
          project_id: string;
          project_name?: string | null;
          steps: Array<Record<string, unknown>>;
          next?: string;
          coupon?: unknown;
          extraCoupons?: unknown[];
          attribution?: unknown;
          promo?: unknown;
        }>;
        summary: {
          total: number;
          ready: number;
          pending: number;
          skipped: number;
          errors: number;
        };
      } = {
        started_at: now.toISOString(),
        items: [],
        summary: { total: items.length, ready: 0, pending: 0, skipped: 0, errors: 0 },
      };

      for (const item of items) {
        const itemExec: {
          project_id: string;
          project_name?: string | null;
          steps: Array<Record<string, unknown>>;
          next?: string;
          coupon?: unknown;
          extraCoupons?: unknown[];
          attribution?: unknown;
          promo?: unknown;
        } = {
          project_id: item.project.id,
          project_name: item.project.name ?? null,
          steps: [],
        };

        // Step: apply (contract)
        const existingContract = await prisma.contract.findUnique({
          where: {
            projectId_userId: { projectId: item.project.id, userId: agent.userId },
          },
          select: { id: true, status: true, commissionPercent: true },
        });

        if (!existingContract) {
          const created = await prisma.contract.create({
            data: {
              projectId: item.project.id,
              userId: agent.userId,
              commissionPercent:
                normalizePercent(item.application?.commissionPercent ?? 20)?.toString() ?? "0.2",
              message: item.application?.message?.trim() || null,
              refundWindowDays:
                item.application?.refundWindowDays !== undefined
                  ? item.application?.refundWindowDays ?? null
                  : null,
              status: "PENDING",
            },
            select: { id: true, status: true },
          });

          itemExec.steps.push({
            kind: "application.submit",
            status: "ok",
            contract_id: created.id,
            contract_status: created.status,
          });
          itemExec.next = "await_contract_approval";
          execution.summary.pending += 1;
          execution.items.push(itemExec);
          continue;
        }

        if (existingContract.status !== "APPROVED") {
          itemExec.steps.push({
            kind: "application.status",
            status: "pending",
            contract_id: existingContract.id,
          });
          itemExec.next = "await_contract_approval";
          execution.summary.pending += 1;
          execution.items.push(itemExec);
          continue;
        }

        itemExec.steps.push({
          kind: "application.status",
          status: "ok",
          contract_id: existingContract.id,
        });

        // Step: coupon
        const project = await prisma.project.findUnique({
          where: { id: item.project.id },
          select: { creatorStripeAccountId: true, name: true, description: true, website: true, category: true },
        });

        if (!project?.creatorStripeAccountId) {
          itemExec.steps.push({
            kind: "coupon.claim",
            status: "skipped",
            reason: "founder_stripe_not_connected",
          });
          itemExec.next = "await_founder_stripe_connect";
          execution.summary.skipped += 1;
          execution.items.push(itemExec);
          continue;
        }

        const template = await prisma.couponTemplate.findUnique({
          where: { id: item.coupon.templateId },
          select: {
            id: true,
            projectId: true,
            name: true,
            percentOff: true,
            stripeCouponId: true,
            status: true,
            startAt: true,
            endAt: true,
            allowedMarketerIds: true,
          },
        });

        if (!template || template.projectId !== item.project.id || template.status !== "ACTIVE") {
          itemExec.steps.push({ kind: "coupon.claim", status: "error", error: "invalid_template" });
          execution.summary.errors += 1;
          execution.items.push(itemExec);
          continue;
        }

        const allowed = Array.isArray(template.allowedMarketerIds)
          ? template.allowedMarketerIds
          : [];
        if (allowed.length > 0 && !allowed.includes(agent.userId)) {
          itemExec.steps.push({ kind: "coupon.claim", status: "error", error: "not_allowed" });
          execution.summary.errors += 1;
          execution.items.push(itemExec);
          continue;
        }

        const stripe = platformStripe();
        const stripeAccount = project.creatorStripeAccountId;

        let coupon:
          | { id: string; code: string; percentOff: number; claimedAt: Date }
          | null = null;

        try {
          let lastError: unknown = null;
          for (let attempt = 0; attempt < 5; attempt += 1) {
            const code =
              attempt === 0 && item.coupon.code
                ? item.coupon.code
                : generatePromoCode(derivePrefix(template.name));

            try {
              const promotionCode = await stripe.promotionCodes.create(
                {
                  promotion: { type: "coupon", coupon: template.stripeCouponId },
                  code,
                  metadata: {
                    projectId: item.project.id,
                    templateId: template.id,
                    marketerId: agent.userId,
                  },
                },
                { stripeAccount },
              );

              coupon = await prisma.coupon.create({
                data: {
                  projectId: item.project.id,
                  templateId: template.id,
                  marketerId: agent.userId,
                  code,
                  stripeCouponId: template.stripeCouponId,
                  stripePromotionCodeId: promotionCode.id,
                  percentOff: template.percentOff,
                  commissionPercent: existingContract.commissionPercent.toString(),
                },
                select: { id: true, code: true, percentOff: true, claimedAt: true },
              });

              break;
            } catch (err) {
              lastError = err;
              continue;
            }
          }

          if (!coupon) {
            throw lastError ?? new Error("Unable to generate coupon");
          }
        } catch (err) {
          itemExec.steps.push({
            kind: "coupon.generate",
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
          execution.summary.errors += 1;
          execution.items.push(itemExec);
          continue;
        }

        itemExec.coupon = coupon;
        itemExec.steps.push({ kind: "coupon.generate", status: "ok", coupon_id: coupon.id });

        // Attribution
        const existingLink = await prisma.attributionShortLink.findUnique({
          where: {
            projectId_marketerId: { projectId: item.project.id, marketerId: agent.userId },
          },
          select: { code: true },
        });

        let shortCode = existingLink?.code ?? null;
        if (!shortCode) {
          for (let attempt = 0; attempt < 5; attempt += 1) {
            const raw = crypto.randomBytes(6).toString("base64url");
            const compact = raw.replace(/[^a-zA-Z0-9]/g, "");
            const candidate = (compact.slice(0, 6) || raw.slice(0, 6)).slice(0, 6);
            try {
              const rec = await prisma.attributionShortLink.create({
                data: { projectId: item.project.id, marketerId: agent.userId, code: candidate },
                select: { code: true },
              });
              shortCode = rec.code;
              break;
            } catch (e) {
              if ((e as { code?: string }).code === "P2002") continue;
              throw e;
            }
          }
        }

        if (!shortCode) {
          itemExec.steps.push({ kind: "attribution", status: "error" });
          execution.summary.errors += 1;
          execution.items.push(itemExec);
          continue;
        }

        const origin = new URL(request.url).origin;
        const attributionUrl = `${origin}/a/${shortCode}`;
        itemExec.attribution = { code: shortCode, url: attributionUrl };
        itemExec.steps.push({ kind: "attribution", status: "ok", code: shortCode });

        // Promo drafts
        const angle = item.promo?.angle ?? "short";
        const name = item.project.name ?? project.name ?? "Project";
        const variants = {
          short: `Hello! ${name} is offering ${coupon.percentOff}% off. Use code ${coupon.code}. Link: ${attributionUrl}`,
          twitter: `Hello! ${name} is offering ${coupon.percentOff}% off. Use code ${coupon.code} ✅\n\n${attributionUrl}`,
          linkedin: `Hello! Sharing a deal: ${name} — ${coupon.percentOff}% off with coupon code ${coupon.code}.\n\n${attributionUrl}`,
          reddit: `Hello! Discount for ${name}: ${coupon.percentOff}% off with code ${coupon.code}.\n\n${attributionUrl}`,
          email: `Subject: ${name} — ${coupon.percentOff}% discount\n\nCoupon code: ${coupon.code}\nLink: ${attributionUrl}`,
        };

        itemExec.promo = {
          headline: `Promo: ${coupon.percentOff}% off with code ${coupon.code}`,
          variants,
          recommended: { angle, body: (variants as any)[angle] },
        };
        itemExec.steps.push({ kind: "promo.draft", status: "ok", angle });

        execution.summary.ready += 1;
        execution.items.push(itemExec);
      }

      const anyPending = execution.items.some((it) => it.next === "await_contract_approval");
      const anyStripePending = execution.items.some(
        (it) => it.next === "await_founder_stripe_connect",
      );

      const next = anyPending
        ? "await_contract_approval"
        : anyStripePending
          ? "await_founder_stripe_connect"
          : "ready_to_promote";

      await prisma.revclawPlan.update({
        where: { id: plan.id },
        data: {
          status: anyPending || anyStripePending ? "APPROVED" : "EXECUTED",
          ...(anyPending || anyStripePending ? {} : { executedAt: new Date() }),
          executionResult: execution as unknown as Prisma.InputJsonValue,
        },
      });

      await markIntentExecuted(intentId, { success: true, data: { next } });
      return NextResponse.json({ data: { ...execution, next } }, { status: 200 });
    }

    // Require scopes based on plan contents (PROJECT_LAUNCH_PLAN)
    requireScope(agent, "projects:draft_write");
    if ((planJson.rewards ?? []).length > 0) {
      requireScope(agent, "rewards:write");
    }
    if ((planJson.couponTemplates ?? []).length > 0) {
      requireScope(agent, "coupons:template_write");
    }
    if (planJson.invitations?.enabled) {
      requireScope(agent, "marketers:read");
      // invitations are a project-side action; still treated as part of plan execution
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
        category: true,
        marketerCommissionPercent: true,
        refundWindowDays: true,
        creatorStripeAccountId: true,
        visibility: true,
        userId: true,
      },
    });

    if (!project || project.userId !== agent.userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Step 2: invitations (choose up to N marketers) (best-effort, idempotent-ish)
    if (planJson.invitations?.enabled) {
      const already = hasStep((s) => s.kind === "invitations.send" && s.status === "ok");
      if (!already) {
        if (!project.category || !project.category.trim()) {
          execution.steps.push({
            kind: "invitations.send",
            status: "skipped",
            reason: "missing_project_category",
            invited_count: 0,
            skipped_count: 0,
            max_marketers: Math.min(20, Math.max(1, planJson.invitations.maxMarketers ?? 20)),
          });
        } else {
          const maxMarketers = Math.min(20, Math.max(1, planJson.invitations.maxMarketers ?? 20));

          const marketers = await prisma.user.findMany({
          where: {
            role: "marketer",
            visibility: { in: ["PUBLIC", "GHOST"] },
          },
          select: {
            id: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 250,
        });

        // lightweight scoring based on project category vs marketer specialties/focus
        const { parseUserMetadata } = await import("@/lib/services/user-metadata");

        const category = (project.category ?? "").trim().toLowerCase();
        const score = (meta: { specialties?: string[]; focusArea?: string | null }) => {
          if (!category) return 0;
          const specialties = (meta.specialties ?? []).map((s) => s.toLowerCase());
          const focus = (meta.focusArea ?? "").toLowerCase();
          let s = 0;
          if (specialties.some((sp) => sp.includes(category) || category.includes(sp))) s += 3;
          if (focus && (focus.includes(category) || category.includes(focus))) s += 2;
          return s;
        };

        const scored = marketers
          .map((m) => {
            const meta = parseUserMetadata(m.metadata);
            return { marketerId: m.id, score: score(meta) };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, maxMarketers);

        const commissionPercent =
          typeof planJson.invitations.commissionPercent === "number"
            ? planJson.invitations.commissionPercent
            : typeof planJson.project.marketerCommissionPercent === "number"
              ? planJson.project.marketerCommissionPercent
              : Math.round(Number(project.marketerCommissionPercent) * 100);

        const refundWindowDays =
          typeof planJson.invitations.refundWindowDays === "number"
            ? planJson.invitations.refundWindowDays
            : typeof planJson.project.refundWindowDays === "number"
              ? planJson.project.refundWindowDays
              : project.refundWindowDays ?? 30;

        const messageBody = planJson.invitations.message;

        let invitedCount = 0;
        let skippedCount = 0;

        for (const r of scored) {
          // Skip if already has contract
          const hasContract = await prisma.contract.findUnique({
            where: { projectId_userId: { projectId: project.id, userId: r.marketerId } },
            select: { id: true },
          });
          if (hasContract) {
            skippedCount += 1;
            continue;
          }

          const existingPending = await prisma.projectInvitation.findFirst({
            where: { projectId: project.id, marketerId: r.marketerId, status: "PENDING" },
            select: { id: true },
          });
          if (existingPending) {
            skippedCount += 1;
            continue;
          }

          await prisma.$transaction(async (tx) => {
            await tx.projectInvitation.create({
              data: {
                projectId: project.id,
                founderId: agent.userId,
                marketerId: r.marketerId,
                status: "PENDING",
                message: messageBody,
                commissionPercentSnapshot: commissionPercent / 100,
                refundWindowDaysSnapshot: refundWindowDays,
              },
              select: { id: true },
            });

            const conv = await tx.conversation.upsert({
              where: {
                projectId_founderId_marketerId: {
                  projectId: project.id,
                  founderId: agent.userId,
                  marketerId: r.marketerId,
                },
              },
              create: {
                projectId: project.id,
                founderId: agent.userId,
                marketerId: r.marketerId,
                createdFrom: "INVITATION",
              },
              update: {},
              select: { id: true },
            });

            const msg = await tx.conversationMessage.create({
              data: {
                conversationId: conv.id,
                senderUserId: agent.userId,
                body: messageBody,
              },
              select: { createdAt: true },
            });

            await tx.conversation.update({
              where: { id: conv.id },
              data: { lastMessageAt: msg.createdAt },
            });
          });

          invitedCount += 1;
        }

        execution.steps.push({
          kind: "invitations.send",
          status: "ok",
          invited_count: invitedCount,
          skipped_count: skippedCount,
          max_marketers: maxMarketers,
        });
        }
      }
    }

    // Step 3: rewards (draft) (idempotent by client_ref)
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
