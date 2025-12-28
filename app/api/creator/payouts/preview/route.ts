import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type ReceiptLine = {
  id: string;
  projectId: string;
  projectName: string;
  marketerId: string | null;
  marketerName: string;
  customerEmail: string | null;
  amount: number;
  marketerCommission: number;
  platformFee: number;
  merchantNet: number;
  createdAt: Date;
};

function buildReceiptLines(
  purchases: Array<{
    id: string;
    projectId: string;
    amount: number;
    commissionAmount: number;
    customerEmail: string | null;
    createdAt: Date;
    project: { name: string; platformCommissionPercent: unknown };
    coupon: { marketerId: string; marketer: { name: string } } | null;
  }>,
) {
  const lines: ReceiptLine[] = purchases.map((purchase) => {
    const platformPercent = Number(purchase.project.platformCommissionPercent) || 0;
    const platformFee = Math.round(purchase.amount * platformPercent);
    const marketerCommission = purchase.commissionAmount;
    const merchantNet = purchase.amount - marketerCommission - platformFee;
    const marketerName = purchase.coupon?.marketer?.name ?? "Direct";

    return {
      id: purchase.id,
      projectId: purchase.projectId,
      projectName: purchase.project.name,
      marketerId: purchase.coupon?.marketerId ?? null,
      marketerName,
      customerEmail: purchase.customerEmail,
      amount: purchase.amount,
      marketerCommission,
      platformFee,
      merchantNet,
      createdAt: purchase.createdAt,
    };
  });

  const totals = lines.reduce(
    (acc, line) => {
      acc.marketerTotal += line.marketerCommission;
      acc.platformTotal += line.platformFee;
      acc.grandTotal += line.marketerCommission + line.platformFee;
      return acc;
    },
    { marketerTotal: 0, platformTotal: 0, grandTotal: 0 },
  );

  const perMarketer = new Map<
    string,
    {
      marketerId: string | null;
      marketerName: string;
      marketerTotal: number;
      platformTotal: number;
    }
  >();

  lines.forEach((line) => {
    const key = line.marketerId ?? "direct";
    const existing = perMarketer.get(key) ?? {
      marketerId: line.marketerId,
      marketerName: line.marketerName,
      marketerTotal: 0,
      platformTotal: 0,
    };
    existing.marketerTotal += line.marketerCommission;
    existing.platformTotal += line.platformFee;
    perMarketer.set(key, existing);
  });

  return {
    lines,
    totals,
    perMarketer: Array.from(perMarketer.values()),
  };
}

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

  const pendingPayment = await prisma.creatorPayment.findFirst({
    where: { creatorId: userId, status: "PENDING" },
    include: {
      purchases: {
        include: {
          project: { select: { name: true, platformCommissionPercent: true } },
          coupon: {
            select: { marketerId: true, marketer: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const purchases =
    pendingPayment?.purchases.length
      ? pendingPayment.purchases
      : await prisma.purchase.findMany({
          where: {
            creatorPaymentId: null,
            commissionAmount: { gt: 0 },
            commissionStatus: "PENDING_CREATOR_PAYMENT",
            project: { userId: creator.id },
          },
          include: {
            project: { select: { name: true, platformCommissionPercent: true } },
            coupon: {
              select: { marketerId: true, marketer: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        });

  const receipt = buildReceiptLines(purchases);

  return NextResponse.json({
    data: {
      paymentId: pendingPayment?.id ?? null,
      purchases: receipt.lines,
      perMarketer: receipt.perMarketer,
      totals: receipt.totals,
    },
  });
}
