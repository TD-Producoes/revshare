import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const marketer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const adjustments = await prisma.commissionAdjustment.findMany({
    where: { marketerId: userId },
    include: {
      project: { select: { id: true, name: true } },
      purchase: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingTotal = adjustments
    .filter((adjustment) => adjustment.status === "PENDING")
    .reduce((sum, adjustment) => sum + adjustment.amount, 0);

  const data = adjustments.map((adjustment) => ({
    id: adjustment.id,
    projectId: adjustment.projectId,
    projectName: adjustment.project.name,
    purchaseId: adjustment.purchase?.id ?? null,
    amount: adjustment.amount,
    currency: adjustment.currency,
    reason: adjustment.reason.toLowerCase(),
    status: adjustment.status.toLowerCase(),
    createdAt: adjustment.createdAt,
  }));

  return NextResponse.json({ data, pendingTotal });
}
