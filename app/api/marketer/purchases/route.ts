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

  const purchases = await prisma.purchase.findMany({
    where: { coupon: { marketerId: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      coupon: { select: { id: true, code: true, percentOff: true } },
    },
  });

  const data = purchases.map((purchase) => ({
    id: purchase.id,
    projectId: purchase.projectId,
    projectName: purchase.project.name,
    couponCode: purchase.coupon?.code ?? null,
    percentOff: purchase.coupon?.percentOff ?? null,
    amount: purchase.amount,
    commissionAmount: purchase.commissionAmount,
    currency: purchase.currency,
    customerEmail: purchase.customerEmail,
    status: purchase.status.toLowerCase(),
    commissionStatus: purchase.commissionStatus.toLowerCase(),
    refundEligibleAt: purchase.refundEligibleAt,
    createdAt: purchase.createdAt,
  }));

  return NextResponse.json({ data });
}
