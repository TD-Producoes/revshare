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

  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true, platformCommissionPercent: true },
  });
  const projectIds = projects.map((project) => project.id);
  const projectPercents = projects
    .map((project) => Number(project.platformCommissionPercent))
    .filter((value) => !Number.isNaN(value));
  const uniquePercents = Array.from(new Set(projectPercents));
  const platformCommissionPercent =
    uniquePercents.length === 1 ? uniquePercents[0] : null;

  if (projectIds.length === 0) {
    return NextResponse.json({
      data: {
        totals: {
          totalCommissions: 0,
          paidCommissions: 0,
          pendingCommissions: 0,
          pendingCreatorCommissions: 0,
          awaitingRefundCommissions: 0,
          readyCommissions: 0,
          failedCommissions: 0,
          platformFee: 0,
          platformCommissionPercent,
        },
        payouts: [],
      },
    });
  }

  const now = new Date();
  const awaitingWithMissing = await prisma.purchase.findMany({
    where: {
      projectId: { in: projectIds },
      commissionStatus: "AWAITING_REFUND_WINDOW",
      refundEligibleAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      refundWindowDays: true,
      project: { select: { refundWindowDays: true } },
    },
  });
  if (awaitingWithMissing.length > 0) {
    await Promise.all(
      awaitingWithMissing.map((purchase) => {
        const effectiveDays =
          purchase.refundWindowDays ??
          purchase.project.refundWindowDays ??
          30;
        const refundEligibleAt = new Date(
          purchase.createdAt.getTime() + effectiveDays * 24 * 60 * 60 * 1000,
        );
        const nextStatus =
          refundEligibleAt <= now ? "READY_FOR_PAYOUT" : "AWAITING_REFUND_WINDOW";
        return prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            refundWindowDays: effectiveDays,
            refundEligibleAt,
            commissionStatus: nextStatus,
          },
        });
      }),
    );
  }

  await prisma.purchase.updateMany({
    where: {
      projectId: { in: projectIds },
      commissionStatus: "AWAITING_REFUND_WINDOW",
      refundEligibleAt: { lte: now },
    },
    data: { commissionStatus: "READY_FOR_PAYOUT" },
  });

  const purchases = await prisma.purchase.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { platformCommissionPercent: true } },
      coupon: {
        select: {
          marketerId: true,
          marketer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const transfers = await prisma.transfer.findMany({
    where: { creatorId: userId },
    select: {
      marketerId: true,
      failureReason: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  let totalCommissions = 0;
  let paidCommissions = 0;
  let pendingCommissions = 0;
  let pendingCreatorCommissions = 0;
  let awaitingRefundCommissions = 0;
  let readyCommissions = 0;
  let failedCommissions = 0;
  let platformFee = 0;

  const marketerMap = new Map<
    string,
    {
      marketerId: string;
      marketerName: string;
      marketerEmail: string | null;
      projectIds: Set<string>;
      totalEarnings: number;
      paidEarnings: number;
      pendingEarnings: number;
      awaitingCreatorEarnings: number;
      awaitingRefundEarnings: number;
      failedEarnings: number;
      readyEarnings: number;
    }
  >();

  for (const purchase of purchases) {
    if (!purchase.coupon?.marketerId) {
      continue;
    }
    const marketerId = purchase.coupon.marketerId;
    const marketer = purchase.coupon.marketer;
    const existing =
      marketerMap.get(marketerId) ??
      {
        marketerId,
        marketerName: marketer?.name ?? "Unknown",
        marketerEmail: marketer?.email ?? null,
        projectIds: new Set<string>(),
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
        awaitingCreatorEarnings: 0,
        awaitingRefundEarnings: 0,
        failedEarnings: 0,
        readyEarnings: 0,
      };

    existing.projectIds.add(purchase.projectId);
    existing.totalEarnings += purchase.commissionAmount;
    totalCommissions += purchase.commissionAmount;
    const platformPercent = Number(purchase.project.platformCommissionPercent) || 0;
    platformFee += Math.round(purchase.commissionAmount * platformPercent);

    if (purchase.commissionStatus === "PAID") {
      existing.paidEarnings += purchase.commissionAmount;
      paidCommissions += purchase.commissionAmount;
    } else if (purchase.commissionStatus === "PENDING_CREATOR_PAYMENT") {
      existing.pendingEarnings += purchase.commissionAmount;
      existing.awaitingCreatorEarnings += purchase.commissionAmount;
      pendingCommissions += purchase.commissionAmount;
      pendingCreatorCommissions += purchase.commissionAmount;
    } else if (purchase.commissionStatus === "AWAITING_REFUND_WINDOW") {
      existing.pendingEarnings += purchase.commissionAmount;
      existing.awaitingRefundEarnings += purchase.commissionAmount;
      pendingCommissions += purchase.commissionAmount;
      awaitingRefundCommissions += purchase.commissionAmount;
    } else if (purchase.commissionStatus === "READY_FOR_PAYOUT") {
      existing.pendingEarnings += purchase.commissionAmount;
      pendingCommissions += purchase.commissionAmount;
      readyCommissions += purchase.commissionAmount;
      existing.readyEarnings += purchase.commissionAmount;
      if (purchase.status === "FAILED") {
        existing.failedEarnings += purchase.commissionAmount;
        failedCommissions += purchase.commissionAmount;
      }
    }

    marketerMap.set(marketerId, existing);
  }

  const payouts = Array.from(marketerMap.values())
    .map((entry) => {
      const latestFailure = transfers.find(
        (transfer) =>
          transfer.marketerId === entry.marketerId &&
          transfer.status === "FAILED",
      );

      return {
        marketerId: entry.marketerId,
        marketerName: entry.marketerName,
        marketerEmail: entry.marketerEmail,
        projectCount: entry.projectIds.size,
        totalEarnings: entry.totalEarnings,
        paidEarnings: entry.paidEarnings,
        pendingEarnings: entry.pendingEarnings,
        awaitingCreatorEarnings: entry.awaitingCreatorEarnings,
        awaitingRefundEarnings: entry.awaitingRefundEarnings,
        failedEarnings: entry.failedEarnings,
        readyEarnings: entry.readyEarnings,
        failureReason: latestFailure?.failureReason ?? null,
      };
    })
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  return NextResponse.json({
    data: {
      totals: {
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        pendingCreatorCommissions,
        awaitingRefundCommissions,
        readyCommissions,
        failedCommissions,
        platformFee,
        platformCommissionPercent,
      },
      payouts,
    },
  });
}
