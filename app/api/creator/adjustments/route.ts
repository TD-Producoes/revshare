import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (userId !== authUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const adjustments = await prisma.commissionAdjustment.findMany({
    where: { creatorId: userId },
    include: {
      marketer: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      purchase: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = adjustments.map((adjustment) => ({
    id: adjustment.id,
    marketerId: adjustment.marketerId,
    marketerName: adjustment.marketer.name,
    marketerEmail: adjustment.marketer.email,
    projectId: adjustment.projectId,
    projectName: adjustment.project.name,
    purchaseId: adjustment.purchase?.id ?? null,
    amount: adjustment.amount,
    currency: adjustment.currency,
    reason: adjustment.reason.toLowerCase(),
    status: adjustment.status.toLowerCase(),
    createdAt: adjustment.createdAt,
  }));

  return NextResponse.json({ data });
}
