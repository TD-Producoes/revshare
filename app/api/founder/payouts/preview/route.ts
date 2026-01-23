import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

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
  currency: string;
  createdAt: Date;
};

function calculateProcessingFee(amountOwed: number) {
  const stripePercentage = 0.029;
  const fixedFee = 30;
  const fee =
    (amountOwed + fixedFee) / (1 - stripePercentage) - amountOwed;
  return Math.max(0, Math.round(fee));
}

function buildReceiptLines(
  purchases: Array<{
    id: string;
    projectId: string;
    amount: number;
    commissionAmount: number;
    currency: string;
    customerEmail: string | null;
    createdAt: Date;
    project: { name: string; platformCommissionPercent: unknown };
    coupon: { marketerId: string; marketer: { name: string } } | null;
  }>,
) {
  const lines: ReceiptLine[] = purchases.map((purchase) => {
    const platformPercent = Number(purchase.project.platformCommissionPercent) || 0;
    const marketerCommission = purchase.commissionAmount;
    const platformFee = Math.round(marketerCommission * platformPercent);
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
      currency: purchase.currency,
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
  const currencySet = new Set(lines.map((line) => line.currency).filter(Boolean));
  const totalsCurrency = currencySet.size === 1 ? [...currencySet][0] : null;

  const processingFee = calculateProcessingFee(totals.grandTotal);
  const totalWithFee = totals.grandTotal + processingFee;

  const perMarketer = new Map<
    string,
    {
      marketerId: string | null;
      marketerName: string;
      marketerTotal: number;
      platformTotal: number;
      currency: string | null;
    }
  >();

  lines.forEach((line) => {
    const key = line.marketerId ?? "direct";
    const existing = perMarketer.get(key) ?? {
      marketerId: line.marketerId,
      marketerName: line.marketerName,
      marketerTotal: 0,
      platformTotal: 0,
      currency: line.currency,
    };
    if (existing.currency && existing.currency !== line.currency) {
      existing.currency = null;
    }
    existing.marketerTotal += line.marketerCommission;
    existing.platformTotal += line.platformFee;
    perMarketer.set(key, existing);
  });

  return {
    lines,
    totals: {
      ...totals,
      processingFee,
      totalWithFee,
      currency: totalsCurrency,
    },
    perMarketer: Array.from(perMarketer.values()),
  };
}

export async function GET(_request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const creator = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const { searchParams } = new URL(_request.url);
  const currencyParam = searchParams.get("currency")?.toLowerCase() ?? null;

  const pendingPayment = await prisma.creatorPayment.findFirst({
    where: { creatorId: creator.id, status: "PENDING" },
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

  const now = new Date();
  const pendingMatchesCurrency = () => {
    if (!pendingPayment?.purchases.length) return false;
    if (!currencyParam) return true;
    if (pendingPayment.currency) {
      return pendingPayment.currency === currencyParam;
    }
    const currencies = new Set(
      pendingPayment.purchases.map((purchase) => purchase.currency.toLowerCase()),
    );
    return currencies.size === 1 && currencies.has(currencyParam);
  };

  const usePending = pendingMatchesCurrency();

  const allPurchases =
    usePending && pendingPayment
      ? pendingPayment.purchases
      : await prisma.purchase.findMany({
        where: {
          creatorPaymentId: null,
          commissionAmount: { gt: 0 },
          project: { userId: creator.id },
            OR: [
              { commissionStatus: "PENDING_CREATOR_PAYMENT" },
              {
                commissionStatus: "AWAITING_REFUND_WINDOW",
                refundEligibleAt: { lte: now },
              },
            ],
          },
          include: {
            project: { select: { name: true, platformCommissionPercent: true } },
            coupon: {
              select: { marketerId: true, marketer: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        });

  const purchases = currencyParam
    ? allPurchases.filter(
        (purchase) => purchase.currency.toLowerCase() === currencyParam,
      )
    : allPurchases;

  const receipt = buildReceiptLines(purchases);
  const availableCurrencies = Array.from(
    new Set(allPurchases.map((purchase) => purchase.currency.toLowerCase())),
  );
  const paymentId = usePending ? pendingPayment?.id ?? null : null;

  return NextResponse.json({
    data: {
      paymentId,
      purchases: receipt.lines,
      perMarketer: receipt.perMarketer,
      totals: receipt.totals,
      availableCurrencies,
    },
  });
}
