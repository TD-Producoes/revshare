import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const purchases = await prisma.purchase.findMany({
    where: { project: { userId: creator.id } },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, platformCommissionPercent: true } },
      coupon: {
        select: {
          code: true,
          marketer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const data = purchases.map((purchase) => ({
    id: purchase.id,
    projectId: purchase.projectId,
    projectName: purchase.project.name,
    customerEmail: purchase.customerEmail,
    amount: purchase.amount,
    commissionAmount: purchase.commissionAmount,
    platformFee: Math.round(
      purchase.commissionAmount *
        (Number(purchase.project.platformCommissionPercent) || 0),
    ),
    commissionStatus: purchase.commissionStatus.toLowerCase(),
    status: purchase.status.toLowerCase(),
    createdAt: purchase.createdAt,
    couponCode: purchase.coupon?.code ?? null,
    marketer: purchase.coupon?.marketer
      ? {
          id: purchase.coupon.marketer.id,
          name: purchase.coupon.marketer.name,
          email: purchase.coupon.marketer.email,
        }
      : null,
  }));

  return NextResponse.json({ data });
}
