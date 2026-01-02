import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type RevenueDataPoint = {
  date: string;
  total: number;
  affiliate: number;
};

export type PublicProjectStats = {
  activeMarketers: number;
  totalPurchases: number;
  avgCommissionPercent: number | null;
  avgPaidCommission: number | null;
  totalRevenue: number;
  affiliateRevenue: number;
  mrr: number;
  revenueTimeline: RevenueDataPoint[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      marketerCommissionPercent: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Calculate date range for last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeMarketers,
    purchaseCount,
    avgCommission,
    totalRevenueAgg,
    affiliateRevenueAgg,
    last30DaysRevenue,
    purchases,
    avgPaidCommissionAgg,
  ] = await Promise.all([
    // Count unique marketers with active coupons for this project
    prisma.coupon
      .groupBy({
        by: ["marketerId"],
        where: {
          projectId,
          status: "ACTIVE",
        },
      })
      .then((groups) => groups.length),

    // Count total purchases
    prisma.purchase.count({
      where: { projectId },
    }),

    // Calculate average commission from coupons (or use project default)
    prisma.coupon.aggregate({
      where: {
        projectId,
        status: "ACTIVE",
      },
      _avg: {
        commissionPercent: true,
      },
    }),

    // Total revenue (all time)
    prisma.purchase.aggregate({
      where: { projectId },
      _sum: { amount: true },
    }),

    // Affiliate revenue (purchases with coupons)
    prisma.purchase.aggregate({
      where: { projectId, couponId: { not: null } },
      _sum: { amount: true },
    }),

    // Last 30 days revenue for MRR calculation
    prisma.purchase.aggregate({
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    }),

    // All purchases for timeline (last 30 days)
    prisma.purchase.findMany({
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        amount: true,
        couponId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    // Average paid commission amount (from purchases with coupons)
    prisma.purchase.aggregate({
      where: {
        projectId,
        couponId: { not: null },
        commissionAmount: { gt: 0 },
      },
      _avg: { commissionAmount: true },
    }),
  ]);

  // Use average from coupons, or fall back to project default
  const avgCommissionPercent =
    avgCommission._avg.commissionPercent != null
      ? Number(avgCommission._avg.commissionPercent) * 100
      : Number(project.marketerCommissionPercent) * 100;

  // Build daily revenue timeline
  const dailyRevenue = new Map<
    string,
    { total: number; affiliate: number }
  >();

  // Initialize all days in range
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split("T")[0];
    dailyRevenue.set(dateKey, { total: 0, affiliate: 0 });
  }

  // Aggregate purchases by day
  for (const purchase of purchases) {
    const dateKey = purchase.createdAt.toISOString().split("T")[0];
    const existing = dailyRevenue.get(dateKey) ?? { total: 0, affiliate: 0 };
    existing.total += purchase.amount;
    if (purchase.couponId) {
      existing.affiliate += purchase.amount;
    }
    dailyRevenue.set(dateKey, existing);
  }

  // Convert to array sorted by date
  const revenueTimeline: RevenueDataPoint[] = Array.from(dailyRevenue.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      total: data.total / 100, // Convert cents to dollars
      affiliate: data.affiliate / 100,
    }));

  const avgPaidCommission =
    avgPaidCommissionAgg._avg.commissionAmount != null
      ? avgPaidCommissionAgg._avg.commissionAmount / 100
      : null;

  const stats: PublicProjectStats = {
    activeMarketers,
    totalPurchases: purchaseCount,
    avgCommissionPercent: Math.round(avgCommissionPercent),
    avgPaidCommission,
    totalRevenue: (totalRevenueAgg._sum.amount ?? 0) / 100,
    affiliateRevenue: (affiliateRevenueAgg._sum.amount ?? 0) / 100,
    mrr: (last30DaysRevenue._sum.amount ?? 0) / 100,
    revenueTimeline,
  };

  return NextResponse.json({ data: stats });
}
