import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const [marketer, project, contract] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    }),
    prisma.contract.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { status: true, commissionPercent: true },
    }),
  ]);

  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!contract || contract.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Contract not approved for this project" },
      { status: 403 },
    );
  }

  const purchaseWhere = {
    projectId,
    coupon: { marketerId: userId },
  };

  const [purchaseTotals, commissionGroups] = await Promise.all([
    prisma.purchase.aggregate({
      where: purchaseWhere,
      _sum: { amount: true, commissionAmount: true },
      _count: true,
    }),
    prisma.purchase.groupBy({
      by: ["commissionStatus"],
      where: purchaseWhere,
      _sum: { commissionAmount: true },
      _count: { _all: true },
    }),
  ]);

  const commissionByStatus = commissionGroups.reduce(
    (acc, entry) => {
      acc[entry.commissionStatus] = {
        count: entry._count._all,
        amount: entry._sum.commissionAmount ?? 0,
      };
      return acc;
    },
    {} as Record<string, { count: number; amount: number }>,
  );

  return NextResponse.json({
    data: {
      projectId,
      projectName: project.name,
      commissionPercent: contract.commissionPercent,
      totals: {
        purchases: purchaseTotals._count,
        revenue: purchaseTotals._sum.amount ?? 0,
        commission: purchaseTotals._sum.commissionAmount ?? 0,
      },
      commissions: {
        awaitingCreator:
          commissionByStatus.PENDING_CREATOR_PAYMENT ?? { count: 0, amount: 0 },
        ready:
          commissionByStatus.READY_FOR_PAYOUT ?? { count: 0, amount: 0 },
        paid: commissionByStatus.PAID ?? { count: 0, amount: 0 },
      },
    },
  });
}
