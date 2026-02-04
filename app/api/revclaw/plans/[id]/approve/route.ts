import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthUserOptional } from "@/lib/auth";
import { hashToken, hashPayload } from "@/lib/revclaw/crypto";

/**
 * POST /api/revclaw/plans/:id/approve
 *
 * Approves a plan via magic-link token OR authenticated session user.
 * Creates a single APPROVED intent of kind PLAN_EXECUTE bound to (plan_id, plan_hash).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const authUser = await getAuthUserOptional();

  const plan = await prisma.revclawPlan.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      planHash: true,
      planJson: true,
      approvalTokenHash: true,
      approvalTokenExpiresAt: true,
      approvalTokenUsedAt: true,
      installationId: true,
      userId: true,
      installation: { select: { agentId: true } },
    },
  });

  if (!plan) {
    return NextResponse.redirect(new URL(`/revclaw/plans/${id}/denied`, request.url));
  }

  // Owner check for session flow
  const isOwner = authUser?.id ? authUser.id === plan.userId : false;

  const now = new Date();
  const tokenValid = token
    ? !!plan.approvalTokenHash &&
      plan.approvalTokenHash === hashToken(token) &&
      !plan.approvalTokenUsedAt &&
      (!plan.approvalTokenExpiresAt || plan.approvalTokenExpiresAt > now)
    : false;

  if (!tokenValid && !isOwner) {
    return NextResponse.redirect(new URL(`/revclaw/plans/${id}`, request.url));
  }

  if (plan.status !== "DRAFT") {
    return NextResponse.redirect(new URL(`/revclaw/plans/${id}`, request.url));
  }

  const intentPayload = {
    plan_id: plan.id,
    plan_hash: plan.planHash,
    plan_json: plan.planJson,
  };

  const payloadHash = hashPayload(intentPayload);

  const intent = await prisma.revclawIntent.create({
    data: {
      installationId: plan.installationId,
      agentId: plan.installation.agentId,
      onBehalfOfUserId: plan.userId,
      kind: "PLAN_EXECUTE",
      payloadJson: intentPayload as object,
      payloadHash,
      idempotencyKey: `plan:${plan.id}:execute`,
      status: "APPROVED",
      approvedAt: now,
      approvedPayloadHash: payloadHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    select: { id: true },
  });

  await prisma.revclawPlan.update({
    where: { id: plan.id },
    data: {
      status: "APPROVED",
      executeIntentId: intent.id,
      approvalTokenUsedAt: tokenValid ? now : plan.approvalTokenUsedAt,
    },
  });

  return NextResponse.redirect(new URL(`/revclaw/plans/${id}/approved`, request.url));
}
