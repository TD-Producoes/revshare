import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  generateSecureToken,
  hashToken,
} from "@/lib/revclaw/crypto";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";
import { computePlanHash, revclawPlanSchema } from "@/lib/revclaw/plan";

const inputSchema = z
  .object({
    max_projects: z.number().int().min(1).max(20).optional().default(5),
    category: z.string().min(1).max(80).optional().nullable(),
    // Defaults used for applications created during execution.
    commission_percent: z.number().min(0).max(100).optional().default(20),
    refund_window_days: z.number().int().min(0).max(3650).optional().default(30),
    application_message: z.string().max(2000).optional().nullable(),
    promo_angle: z.enum(["short", "twitter", "linkedin", "reddit", "email"]).optional().default("twitter"),
    min_discount_percent: z.number().int().min(1).max(100).optional().nullable(),
  })
  .optional();

/**
 * POST /api/revclaw/marketer/plans/suggest-batch
 *
 * Convenience endpoint for marketer-bots.
 *
 * - Discovers PUBLIC projects (optionally filtered by category).
 * - Picks the best ACTIVE coupon template for each project (highest % off).
 * - Creates a MARKETER_BATCH_PROMO_PLAN directly and returns { plan_id, plan_url }.
 *
 * Auth: access token (Authorization: Bearer <access_token>)
 * Scope: projects:read
 */
export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:read");

    const inputParsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!inputParsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: inputParsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = inputParsed.data ?? {
      max_projects: 5,
      category: null,
      commission_percent: 20,
      refund_window_days: 30,
      application_message: null,
      promo_angle: "twitter" as const,
      min_discount_percent: null,
    };

    const installation = await prisma.revclawInstallation.findUnique({
      where: { id: agent.installationId },
      select: { allowedCategories: true },
    });

    const allowedCategories =
      installation?.allowedCategories && Array.isArray(installation.allowedCategories)
        ? (installation.allowedCategories as string[])
        : [];

    // Choose category filter priority:
    // 1) explicit input.category
    // 2) installation.allowedCategories (if exactly one)
    // 3) no filter
    const categoryFilter =
      input.category?.trim() || (allowedCategories.length === 1 ? allowedCategories[0] : null);

    const candidates = await prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(allowedCategories.length > 0 ? { category: { in: allowedCategories } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(input.max_projects * 3, input.max_projects),
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    const now = new Date();

    const items: Array<{
      project: { id: string; name: string };
      application: {
        commissionPercent: number;
        refundWindowDays: number;
        message: string | null;
      };
      coupon: { templateId: string; code: null; extraCoupons: number };
      promo: { angle: "short" | "twitter" | "linkedin" | "reddit" | "email" };
    }> = [];

    for (const project of candidates) {
      if (items.length >= input.max_projects) break;

      const templates = await prisma.couponTemplate.findMany({
        where: {
          projectId: project.id,
          status: "ACTIVE",
        },
        orderBy: [{ percentOff: "desc" }, { createdAt: "desc" }],
        take: 10,
        select: {
          id: true,
          percentOff: true,
          startAt: true,
          endAt: true,
          allowedMarketerIds: true,
        },
      });

      const filtered = templates.filter((t) => {
        const allowed = Array.isArray(t.allowedMarketerIds) ? t.allowedMarketerIds : [];
        if (allowed.length > 0 && !allowed.includes(agent.userId)) return false;
        if (t.startAt && now < t.startAt) return false;
        if (t.endAt && now > t.endAt) return false;
        if (input.min_discount_percent && t.percentOff < input.min_discount_percent) return false;
        return true;
      });

      const picked = filtered[0];
      if (!picked) continue;

      items.push({
        project: { id: project.id, name: project.name },
        application: {
          commissionPercent: input.commission_percent,
          refundWindowDays: input.refund_window_days,
          message:
            input.application_message?.trim() ||
            `I can promote ${project.name} with content + community distribution.`,
        },
        coupon: { templateId: picked.id, code: null, extraCoupons: 0 },
        promo: { angle: input.promo_angle },
      });
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "No suitable projects found",
          code: "no_candidates",
          details: {
            categoryFilter,
            allowedCategories,
          },
        },
        { status: 404 },
      );
    }

    const planJson = {
      kind: "MARKETER_BATCH_PROMO_PLAN",
      items,
      notes: `Auto-suggested batch plan (${items.length} projects).`,
    };

    const planParsed = revclawPlanSchema.safeParse(planJson);
    if (!planParsed.success) {
      return NextResponse.json(
        { error: "Invalid plan", details: planParsed.error.flatten() },
        { status: 400 },
      );
    }

    const planHash = computePlanHash(planParsed.data);

    const approvalTokenPlain = generateSecureToken(32);
    const approvalTokenHash = hashToken(approvalTokenPlain);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const plan = await prisma.revclawPlan.create({
      data: {
        installationId: agent.installationId,
        userId: agent.userId,
        status: "DRAFT",
        planJson: planParsed.data,
        planHash,
        approvalTokenHash,
        approvalTokenExpiresAt: expiresAt,
      },
      select: { id: true },
    });

    const origin = new URL(request.url).origin;
    const plan_url = `${origin}/revclaw/plans/${plan.id}?token=${encodeURIComponent(approvalTokenPlain)}`;

    return NextResponse.json(
      {
        plan_id: plan.id,
        status: "draft",
        plan_url,
        expires_at: expiresAt.toISOString(),
        suggested: {
          category: categoryFilter,
          projects: items.map((it) => ({ id: it.project.id, name: it.project.name })),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
