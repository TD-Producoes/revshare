import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, userId);
  } catch (error) {
    return authErrorResponse(error);
  }

  const marketer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const [totals, pendingTotals] = await Promise.all([
    prisma.purchase.aggregate({
      where: {
        coupon: { marketerId: userId },
        commissionStatus: { notIn: ["REFUNDED", "CHARGEBACK"] },
      },
      _sum: {
        amount: true,
        commissionAmount: true,
      },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: {
        coupon: { marketerId: userId },
        status: "PENDING",
        commissionStatus: { notIn: ["REFUNDED", "CHARGEBACK"] },
      },
      _sum: { commissionAmount: true },
    }),
  ]);

  return NextResponse.json({
    data: {
      totalPurchases: totals._count ?? 0,
      totalRevenue: totals._sum.amount ?? 0,
      totalEarnings: totals._sum.commissionAmount ?? 0,
      pendingEarnings: pendingTotals._sum.commissionAmount ?? 0,
    },
  });
}
