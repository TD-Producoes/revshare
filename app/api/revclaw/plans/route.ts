import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  hashToken,
  generateSecureToken,
} from "@/lib/revclaw/crypto";
import { authenticateBot, botAuthErrorResponse } from "@/lib/revclaw/intent-auth";
import { computePlanHash, revclawPlanSchema } from "@/lib/revclaw/plan";

const PLAN_EXPIRY_MINUTES = 60;

const inputSchema = z.object({
  plan_json: z.unknown(),
  idempotency_key: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/revclaw/plans
 *
 * Bot creates a plan for a user to review.
 * Authentication: Bot bearer token (agent_secret)
 * Required header: X-RevClaw-User-Id
 */
export async function POST(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const auth = await authenticateBot(request);
  if (!auth.success) {
    return botAuthErrorResponse(auth);
  }

  const planParsed = revclawPlanSchema.safeParse(parsed.data.plan_json);
  if (!planParsed.success) {
    return NextResponse.json(
      { error: "Invalid plan", details: planParsed.error.flatten() },
      { status: 400 },
    );
  }

  const planJson = planParsed.data;
  const planHash = computePlanHash(planJson);

  const idempotencyKey = parsed.data.idempotency_key;
  if (idempotencyKey) {
    const existing = await prisma.revclawPlan.findFirst({
      where: {
        installationId: auth.context.installationId,
        status: "DRAFT",
        // store in metadata later; for now: use hash as dedupe
        planHash,
      },
      select: { id: true },
    });
    if (existing) {
      const baseUrl = process.env.BASE_URL ?? "https://revshare.fast";
      return NextResponse.json(
        {
          plan_id: existing.id,
          status: "draft",
          plan_url: `${baseUrl}/revclaw/plans/${existing.id}`,
        },
        { status: 200 },
      );
    }
  }

  const approvalTokenPlain = generateSecureToken(32);
  const approvalTokenHash = hashToken(approvalTokenPlain);
  const expiresAt = new Date(Date.now() + PLAN_EXPIRY_MINUTES * 60 * 1000);

  const plan = await prisma.revclawPlan.create({
    data: {
      installationId: auth.context.installationId,
      userId: auth.context.userId,
      status: "DRAFT",
      planJson,
      planHash,
      approvalTokenHash,
      approvalTokenExpiresAt: expiresAt,
    },
    select: { id: true, status: true },
  });

  const baseUrl = process.env.BASE_URL ?? "https://revshare.fast";
  const plan_url = `${baseUrl}/revclaw/plans/${plan.id}?token=${encodeURIComponent(
    approvalTokenPlain,
  )}`;

  return NextResponse.json(
    {
      plan_id: plan.id,
      status: plan.status.toLowerCase(),
      plan_url,
      expires_at: expiresAt.toISOString(),
    },
    { status: 201 },
  );
}
