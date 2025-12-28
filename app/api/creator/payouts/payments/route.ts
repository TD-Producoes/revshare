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

  const payments = await prisma.creatorPayment.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amountTotal: true,
      marketerTotal: true,
      platformFeeTotal: true,
      status: true,
      createdAt: true,
      _count: { select: { purchases: true } },
      stripeCheckoutSessionId: true,
    },
  });

  const data = payments.map((payment) => ({
    id: payment.id,
    amountTotal: payment.amountTotal,
    marketerTotal: payment.marketerTotal,
    platformFeeTotal: payment.platformFeeTotal,
    status: payment.status.toLowerCase(),
    createdAt: payment.createdAt,
    purchaseCount: payment._count.purchases,
    stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
  }));

  return NextResponse.json({ data });
}
