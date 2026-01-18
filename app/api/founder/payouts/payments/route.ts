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
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const payments = await prisma.creatorPayment.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amountTotal: true,
      marketerTotal: true,
      platformFeeTotal: true,
      currency: true,
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
    currency: payment.currency,
    status: payment.status.toLowerCase(),
    createdAt: payment.createdAt,
    purchaseCount: payment._count.purchases,
    stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
    type: "commission",
  }));

  const rewardRows = await prisma.rewardEarned.findMany({
    where: {
      status: "PAID",
      paidAt: { not: null },
      reward: { rewardType: "MONEY", project: { userId } },
    },
    select: {
      id: true,
      paidAt: true,
      rewardAmount: true,
      rewardCurrency: true,
      rewardTransferId: true,
      reward: { select: { rewardAmount: true, rewardCurrency: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const rewardGroups = new Map<
    string,
    {
      id: string;
      createdAt: Date;
      amountTotal: number;
      rewardCount: number;
      currency: string | null;
    }
  >();

  rewardRows.forEach((row) => {
    const amount = row.rewardAmount ?? row.reward.rewardAmount ?? 0;
    if (!amount || !row.paidAt) return;
    const currency = (
      row.rewardCurrency ?? row.reward.rewardCurrency ?? null
    )?.toLowerCase() ?? null;
    const key = row.rewardTransferId ?? `reward-${row.id}`;
    const existing = rewardGroups.get(key) ?? {
      id: `reward-${key}`,
      createdAt: row.paidAt,
      amountTotal: 0,
      rewardCount: 0,
      currency,
    };
    existing.amountTotal += amount;
    existing.rewardCount += 1;
    if (row.paidAt > existing.createdAt) {
      existing.createdAt = row.paidAt;
    }
    if (existing.currency && currency && existing.currency !== currency) {
      existing.currency = null;
    }
    rewardGroups.set(key, existing);
  });

  const rewardPayments = Array.from(rewardGroups.values()).map((entry) => ({
    id: entry.id,
    amountTotal: entry.amountTotal,
    marketerTotal: entry.amountTotal,
    platformFeeTotal: 0,
    currency: entry.currency,
    status: "paid",
    createdAt: entry.createdAt,
    purchaseCount: entry.rewardCount,
    stripeCheckoutSessionId: null,
    type: "reward",
  }));

  const combined = [...data, ...rewardPayments].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ data: combined });
}
