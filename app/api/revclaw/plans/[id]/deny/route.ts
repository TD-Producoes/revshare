import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthUserOptional } from "@/lib/auth";
import { hashToken } from "@/lib/revclaw/crypto";

/**
 * POST /api/revclaw/plans/:id/deny
 *
 * Denies a plan via magic-link token OR authenticated session user.
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
      approvalTokenHash: true,
      approvalTokenExpiresAt: true,
      approvalTokenUsedAt: true,
      userId: true,
    },
  });

  if (!plan) {
    return NextResponse.redirect(new URL(`/revclaw/plans/${id}/denied`, request.url));
  }

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

  await prisma.revclawPlan.update({
    where: { id },
    data: {
      status: "CANCELED",
      approvalTokenUsedAt: tokenValid ? now : plan.approvalTokenUsedAt,
    },
  });

  return NextResponse.redirect(new URL(`/revclaw/plans/${id}/denied`, request.url));
}
