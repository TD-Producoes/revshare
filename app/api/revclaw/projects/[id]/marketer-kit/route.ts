import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";
import { withIntentEnforcement } from "@/lib/revclaw/intent-enforcement";
import { generatePromoCode } from "@/lib/codes";
import { platformStripe } from "@/lib/stripe";

const schema = z.object({
  // 1) Apply / contract
  commissionPercent: z.number().min(0).max(100),
  refundWindowDays: z.number().int().min(0).max(3650).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),

  // 2) Claim coupon
  templateId: z.string().min(1),
  couponCode: z.string().min(3).optional().nullable(),
  extraCoupons: z.number().int().min(0).max(5).optional().default(0),

  // 3) Promo draft
  angle: z.enum(["short", "twitter", "linkedin", "reddit", "email"]).optional().default("short"),
});

type RouteParams = { id: string };

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

function matchesPercent(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

function derivePrefix(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return sanitized.length > 0 ? sanitized : "REV";
}

/**
 * POST /api/revclaw/projects/:id/marketer-kit
 *
 * Convenience endpoint for marketer-bots:
 * - Apply to project (creates Contract)
 * - If contract is APPROVED: claim a coupon template
 * - Get attribution link
 * - Generate promo content drafts that mention coupon code + discount
 *
 * Notes:
 * - If contract becomes PENDING, we stop and return the contract status.
 * - Does NOT publish anywhere.
 *
 * Auth: RevClaw access token (marketer installation)
 * Scopes:
 *   - applications:submit
 *   - coupons:claim
 *   - projects:read
 *   - outreach:draft
 * Approval:
 *   - Intent-gated as APPLICATION_SUBMIT (so humans can review applications when desired)
 */
export const POST = withIntentEnforcement<RouteParams>(
  "APPLICATION_SUBMIT",
  async (request: NextRequest, { params }) => {
    try {
      const agent = await authenticateAgent(request);
      requireScope(agent, "applications:submit");

      const { id: projectId } = await params;

      const parsed = schema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const input = parsed.data;

      const [marketer, project] = await Promise.all([
        prisma.user.findUnique({
          where: { id: agent.userId },
          select: { id: true, role: true, stripeConnectedAccountId: true },
        }),
        prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            description: true,
            website: true,
            category: true,
            creatorStripeAccountId: true,
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

      // (A) Apply / create contract if missing
      const existing = await prisma.contract.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: marketer.id } },
        select: { id: true, status: true, commissionPercent: true },
      });

      let contract = existing;
      if (!contract) {
        const commissionPercent = normalizePercent(input.commissionPercent);

        const requiresMatchingTerms = project.autoApproveMatchTerms;
        const requiresVerifiedMarketer = project.autoApproveVerifiedOnly;
        const hasMatchingCommission = matchesPercent(
          commissionPercent,
          Number(project.marketerCommissionPercent),
        );
        const requestedRefundWindow = input.refundWindowDays ?? project.refundWindowDays;
        const hasMatchingRefundWindow = requestedRefundWindow === project.refundWindowDays;
        const hasVerifiedMarketer = Boolean(marketer.stripeConnectedAccountId);
        const shouldAutoApprove = project.autoApproveApplications
          ? (!requiresMatchingTerms || (hasMatchingCommission && hasMatchingRefundWindow)) &&
            (!requiresVerifiedMarketer || hasVerifiedMarketer)
          : false;

        contract = await prisma.contract.create({
          data: {
            projectId: project.id,
            userId: marketer.id,
            commissionPercent: commissionPercent.toString(),
            message: input.message?.trim() || null,
            refundWindowDays:
              input.refundWindowDays !== undefined ? input.refundWindowDays ?? null : null,
            status: shouldAutoApprove ? "APPROVED" : "PENDING",
          },
          select: { id: true, status: true, commissionPercent: true },
        });
      }

      const baseResponse: Record<string, unknown> = {
        contract: {
          id: contract.id,
          status: contract.status.toLowerCase(),
          commissionPercent: Number(contract.commissionPercent),
        },
        project: { id: project.id, name: project.name },
      };

      if (contract.status !== "APPROVED") {
        // Stop here: marketer bot can re-run later once contract is approved.
        return NextResponse.json({ data: { ...baseResponse, next: "await_contract_approval" } });
      }

      // (B) Claim coupon
      requireScope(agent, "coupons:claim");

      if (!project.creatorStripeAccountId) {
        return NextResponse.json(
          {
            data: {
              ...baseResponse,
              error: "Founder Stripe account not set",
              next: "await_founder_stripe_connect",
            },
          },
          { status: 200 },
        );
      }

      const template = await prisma.couponTemplate.findUnique({
        where: { id: input.templateId },
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
      });

      if (!template || template.projectId !== project.id) {
        return NextResponse.json(
          { data: { ...baseResponse, error: "Coupon template not found" } },
          { status: 200 },
        );
      }

      const now = new Date();
      if (template.status !== "ACTIVE") {
        return NextResponse.json(
          { data: { ...baseResponse, error: "Coupon template is not active" } },
          { status: 200 },
        );
      }
      if (template.startAt && now < template.startAt) {
        return NextResponse.json(
          { data: { ...baseResponse, error: "Coupon template is not active yet" } },
          { status: 200 },
        );
      }
      if (template.endAt && now > template.endAt) {
        return NextResponse.json(
          { data: { ...baseResponse, error: "Coupon template has expired" } },
          { status: 200 },
        );
      }

      const allowed = Array.isArray(template.allowedMarketerIds) ? template.allowedMarketerIds : [];
      if (allowed.length > 0 && !allowed.includes(agent.userId)) {
        return NextResponse.json(
          {
            data: {
              ...baseResponse,
              error: "You are not allowed to claim this coupon template",
            },
          },
          { status: 200 },
        );
      }

      const existingCoupon = await prisma.coupon.findFirst({
        where: {
          templateId: template.id,
          marketerId: agent.userId,
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
        },
      });

      const stripe = platformStripe();
      const stripeAccount = project.creatorStripeAccountId;

      const coupon =
        existingCoupon ??
        (await (async () => {
          const code = input.couponCode ?? generatePromoCode(derivePrefix(template.name));
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

          return prisma.coupon.create({
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
        })());

      const extraCoupons = [] as Array<{
        id: string;
        code: string;
        percentOff: number;
        commissionPercent: unknown;
        status: string;
        claimedAt: Date;
      }>;

      if (input.extraCoupons > 0) {
        for (let i = 0; i < input.extraCoupons; i += 1) {
          const code = generatePromoCode(derivePrefix(template.name));
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

          const created = await prisma.coupon.create({
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

          extraCoupons.push(created);
        }
      }

      // (C) Attribution link
      requireScope(agent, "projects:read");

      const existingLink = await prisma.attributionShortLink.findUnique({
        where: { projectId_marketerId: { projectId: project.id, marketerId: agent.userId } },
        select: { code: true },
      });

      const code = existingLink?.code ?? null;
      const origin = new URL(request.url).origin;

      let finalCode = code;
      if (!finalCode) {
        // simple retry loop like the non-revclaw endpoint
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const raw = crypto.randomBytes(6).toString("base64url");
          const compact = raw.replace(/[^a-zA-Z0-9]/g, "");
          const candidate = (compact.slice(0, 6) || raw.slice(0, 6)).slice(0, 6);
          try {
            const record = await prisma.attributionShortLink.create({
              data: { projectId: project.id, marketerId: agent.userId, code: candidate },
              select: { code: true },
            });
            finalCode = record.code;
            break;
          } catch (e) {
            if ((e as { code?: string }).code === "P2002") continue;
            throw e;
          }
        }
      }

      if (!finalCode) {
        return NextResponse.json(
          { data: { ...baseResponse, coupon, error: "Unable to create attribution link" } },
          { status: 200 },
        );
      }

      const attributionUrl = `${origin}/a/${finalCode}`;

      // (D) Promo drafts
      requireScope(agent, "outreach:draft");

      const headline = `${project.name}: ${coupon.percentOff}% off with code ${coupon.code}`;
      const urlLine = `Use link: ${attributionUrl}`;
      const basePitch = project.description
        ? project.description
        : project.website
          ? `Check it out at ${project.website}`
          : `Discover ${project.name}`;

      const variants: Record<string, { title: string; body: string }> = {
        short: {
          title: "Short",
          body: `Hello! Quick deal: ${headline}. ${basePitch}. ${urlLine}`,
        },
        twitter: {
          title: "X/Twitter",
          body: `Hello! ${project.name} is offering ${coupon.percentOff}% off. Use code ${coupon.code} ✅\n\n${attributionUrl}`,
        },
        linkedin: {
          title: "LinkedIn",
          body: `Hello! If you’re exploring ${project.category ?? "new tools"}, you might like ${project.name}.\n\nThey’re offering ${coupon.percentOff}% off with coupon code ${coupon.code}.\n\n${attributionUrl}`,
        },
        reddit: {
          title: "Reddit",
          body: `Hello! Sharing a discount for ${project.name}: ${coupon.percentOff}% off with code ${coupon.code}.\n\nLink: ${attributionUrl}\n\n(If this isn’t appropriate for this sub, happy to delete.)`,
        },
        email: {
          title: "Email",
          body: `Subject: ${project.name} — ${coupon.percentOff}% discount\n\nHello,\n\nIf you’re interested in ${project.category ?? "this"}, ${project.name} is offering ${coupon.percentOff}% off.\n\nCoupon code: ${coupon.code}\nLink: ${attributionUrl}\n\nBest,`,
        },
      };

      return NextResponse.json(
        {
          data: {
            ...baseResponse,
            coupon,
            extraCoupons,
            attribution: { code: finalCode, url: attributionUrl },
            promo: {
              headline,
              variants,
              recommended: variants[input.angle],
            },
            next: "ready_to_promote",
          },
        },
        { status: 200 },
      );
    } catch (err) {
      return authErrorResponse(err);
    }
  },
  async (request, ctx) => {
    // Intent preview payload should include the project id + high-level inputs.
    const { id: projectId } = await ctx.params;
    const raw = await request.json().catch(() => null);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { project_id: projectId, invalid: true };
    return {
      project_id: projectId,
      commissionPercent: parsed.data.commissionPercent,
      refundWindowDays: parsed.data.refundWindowDays ?? null,
      templateId: parsed.data.templateId,
      extraCoupons: parsed.data.extraCoupons,
      angle: parsed.data.angle,
    };
  },
);
