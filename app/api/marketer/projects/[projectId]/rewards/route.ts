import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

type PurchaseRow = {
  amount: number;
  customerEmail: string | null;
  createdAt: Date;
  refundEligibleAt: Date | null;
};

type AttributionRow = {
  deviceId: string;
  createdAt: Date;
};

const aggregateRows = (rows: PurchaseRow[]) => {
  const customers = new Set<string>();
  let revenue = 0;
  let sales = 0;
  rows.forEach((row) => {
    revenue += row.amount ?? 0;
    sales += 1;
    if (row.customerEmail) {
      customers.add(row.customerEmail.toLowerCase());
    }
  });
  return { revenue, sales, customers: customers.size };
};

const getAttributionTotals = (rows: AttributionRow[]) => {
  let clicks = 0;
  let installs = 0;
  rows.forEach((row) => {
    if (row.deviceId?.startsWith("click:")) {
      clicks += 1;
      return;
    }
    if (row.deviceId?.startsWith("install:")) {
      installs += 1;
    }
  });
  return { clicks, installs };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const marketerId = searchParams.get("userId");

  if (!marketerId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (marketerId !== authUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const marketer = await prisma.user.findUnique({
    where: { id: marketerId },
    select: { id: true, role: true },
  });
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const contract = await prisma.contract.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: marketerId,
      },
    },
    select: { id: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const [rewards, earnedRows, purchases, attributionRows] = await Promise.all([
    prisma.reward.findMany({
      where: {
        projectId,
        OR: [
          { status: "ACTIVE" },
          { earned: { some: { marketerId } } },
        ],
      },
      orderBy: { milestoneValue: "asc" },
    }),
    prisma.rewardEarned.findMany({
      where: { projectId, marketerId },
      include: { rewardCoupon: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.purchase.findMany({
      where: {
        projectId,
        commissionStatus: { notIn: ["REFUNDED", "CHARGEBACK"] },
        OR: [
          { coupon: { marketerId } },
          { marketerId },
        ],
      },
      select: {
        amount: true,
        customerEmail: true,
        createdAt: true,
        refundEligibleAt: true,
      },
    }),
    prisma.attributionClick.findMany({
      where: { projectId, marketerId },
      select: {
        deviceId: true,
        createdAt: true,
      },
    }),
  ]);

  const earnedByReward = new Map<string, typeof earnedRows>();
  earnedRows.forEach((row) => {
    const existing = earnedByReward.get(row.rewardId) ?? [];
    existing.push(row);
    earnedByReward.set(row.rewardId, existing);
  });

  const filteredRewards = rewards.filter((reward) => {
    const allowed = Array.isArray(reward.allowedMarketerIds)
      ? reward.allowedMarketerIds
      : [];
    if (allowed.length === 0) return true;
    if (allowed.includes(marketerId)) return true;
    return (earnedByReward.get(reward.id) ?? []).length > 0;
  });

  const now = new Date();

  const rewardItems = filteredRewards.map((reward) => {
    const rewardStart = reward.startsAt ?? reward.createdAt;
    const relevant = purchases.filter((row) => row.createdAt >= rewardStart);
    const eligible = relevant.filter(
      (row) => row.refundEligibleAt && row.refundEligibleAt <= now,
    );
    const relevantAttribution = attributionRows.filter(
      (row) => row.createdAt >= rewardStart,
    );

    const eligibleTotals = aggregateRows(eligible);
    const totalTotals = aggregateRows(relevant);
    const attributionTotals = getAttributionTotals(relevantAttribution);

    const metricEligible = (() => {
      if (reward.milestoneType === "NET_REVENUE") return eligibleTotals.revenue;
      if (reward.milestoneType === "COMPLETED_SALES") return eligibleTotals.sales;
      if (reward.milestoneType === "CLICKS") return attributionTotals.clicks;
      return attributionTotals.installs;
    })();

    const metricTotal = (() => {
      if (reward.milestoneType === "NET_REVENUE") return totalTotals.revenue;
      if (reward.milestoneType === "COMPLETED_SALES") return totalTotals.sales;
      if (reward.milestoneType === "CLICKS") return attributionTotals.clicks;
      return attributionTotals.installs;
    })();

    const earned = earnedByReward.get(reward.id) ?? [];
    const earnedCount = earned.length;
    const latestEarned = earned[0] ?? null;

    const milestoneValue = reward.milestoneValue;
    const achievedEligible = Math.floor(metricEligible / milestoneValue);
    const achievedTotal = Math.floor(metricTotal / milestoneValue);
    const hasRefundWindow =
      reward.milestoneType === "NET_REVENUE" ||
      reward.milestoneType === "COMPLETED_SALES";

    const nextTarget =
      reward.earnLimit === "ONCE_PER_MARKETER"
        ? milestoneValue
        : milestoneValue;

    let status: "IN_PROGRESS" | "PENDING_REFUND" | "UNLOCKED" | "CLAIMED" | "PAID" =
      "IN_PROGRESS";

    if (reward.earnLimit === "MULTIPLE" && achievedEligible > earnedCount) {
      status = "UNLOCKED";
    } else if (latestEarned?.status === "PAID") {
      status = "PAID";
    } else if (latestEarned?.status === "CLAIMED") {
      status = "CLAIMED";
    } else if (latestEarned?.status === "UNLOCKED") {
      status = "UNLOCKED";
    } else if (
      reward.earnLimit === "ONCE_PER_MARKETER" &&
      achievedEligible >= 1
    ) {
      status = "UNLOCKED";
    } else if (hasRefundWindow && achievedTotal > achievedEligible) {
      status = "PENDING_REFUND";
    }

    const progressValue =
      reward.earnLimit === "MULTIPLE"
        ? Math.max(0, metricEligible - earnedCount * milestoneValue)
        : Math.min(metricEligible, nextTarget);
    const progressTotal =
      reward.earnLimit === "MULTIPLE"
        ? Math.max(0, metricTotal - earnedCount * milestoneValue)
        : metricTotal;
    const progressPercent =
      nextTarget > 0 ? Math.min((progressValue / nextTarget) * 100, 100) : 0;

    return {
      reward,
      earned: latestEarned,
      earnedList: earned,
      progress: {
        current: progressValue,
        total: progressTotal,
        goal: nextTarget,
        percent: progressPercent,
      },
      status,
    };
  });

  return NextResponse.json({ data: rewardItems });
}
