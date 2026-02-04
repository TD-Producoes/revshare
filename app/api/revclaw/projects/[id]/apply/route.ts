import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";
import { withIntentEnforcement } from "@/lib/revclaw/intent-enforcement";

const schema = z.object({
  commissionPercent: z.number().min(0).max(100),
  refundWindowDays: z.number().int().min(0).max(3650).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

type RouteParams = { id: string };

async function extractPayload(request: NextRequest, ctx: { params: Promise<RouteParams> }) {
  const { id: projectId } = await ctx.params;
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { project_id: projectId, invalid: true };
  return {
    project_id: projectId,
    commissionPercent: parsed.data.commissionPercent,
    refundWindowDays: parsed.data.refundWindowDays ?? null,
    message: parsed.data.message ?? null,
  };
}

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

function matchesPercent(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

/**
 * POST /api/revclaw/projects/:id/apply
 *
 * Marketer applies to a project by creating a Contract (application).
 *
 * Auth: RevClaw access token (marketer installation)
 * Scope: applications:submit
 * Approval: requires intent kind APPLICATION_SUBMIT by default
 */
export const POST = withIntentEnforcement<RouteParams>(
  "APPLICATION_SUBMIT",
  async (request: NextRequest, { params }) => {
    try {
      const agent = await authenticateAgent(request);
      requireScope(agent, "applications:submit");

      const { id: projectId } = await params;

      const raw = await request.json().catch(() => null);
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const payload = parsed.data;

      const [marketer, project] = await Promise.all([
        prisma.user.findUnique({
          where: { id: agent.userId },
          select: {
            id: true,
            role: true,
            name: true,
            email: true,
            stripeConnectedAccountId: true,
          },
        }),
        prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            userId: true,
            refundWindowDays: true,
            marketerCommissionPercent: true,
            autoApproveApplications: true,
            autoApproveMatchTerms: true,
            autoApproveVerifiedOnly: true,
          },
        }),
      ]);

      if (!marketer || marketer.role !== "marketer") {
        return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
      }

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const existing = await prisma.contract.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: marketer.id,
          },
        },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json({ error: "Contract already exists" }, { status: 409 });
      }

      const commissionPercent = normalizePercent(payload.commissionPercent);

      const requiresMatchingTerms = project.autoApproveMatchTerms;
      const requiresVerifiedMarketer = project.autoApproveVerifiedOnly;
      const hasMatchingCommission = matchesPercent(
        commissionPercent,
        Number(project.marketerCommissionPercent),
      );
      const requestedRefundWindow = payload.refundWindowDays ?? project.refundWindowDays;
      const hasMatchingRefundWindow = requestedRefundWindow === project.refundWindowDays;
      const hasVerifiedMarketer = Boolean(marketer.stripeConnectedAccountId);
      const shouldAutoApprove = project.autoApproveApplications
        ? (!requiresMatchingTerms || (hasMatchingCommission && hasMatchingRefundWindow)) &&
          (!requiresVerifiedMarketer || hasVerifiedMarketer)
        : false;

      const contract = await prisma.contract.create({
        data: {
          projectId: project.id,
          userId: marketer.id,
          commissionPercent: commissionPercent.toString(),
          message: payload.message?.trim() || null,
          refundWindowDays:
            payload.refundWindowDays !== undefined ? payload.refundWindowDays ?? null : null,
          status: shouldAutoApprove ? "APPROVED" : "PENDING",
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        {
          data: {
            contract_id: contract.id,
            status: contract.status.toLowerCase(),
            project_id: project.id,
            project_name: project.name,
          },
        },
        { status: 201 },
      );
    } catch (err) {
      return authErrorResponse(err);
    }
  },
  extractPayload,
);
