import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type RevenueDataPoint = {
  date: string;
  total: number;
  affiliate: number;
};

export type PublicProjectStats = {
  activeMarketers: number | null | -1; // -1 means hidden by visibility settings
  totalPurchases: number | null | -1; // -1 means hidden by visibility settings
  avgCommissionPercent: number | null | -1; // -1 means hidden by visibility settings
  avgPaidCommission: number | null | -1; // -1 means hidden by visibility settings
  totalRevenue: number | null | -1; // -1 means hidden by visibility settings
  affiliateRevenue: number | null | -1; // -1 means hidden by visibility settings
  mrr: number | null | -1; // -1 means hidden by visibility settings
  revenueTimeline: RevenueDataPoint[] | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      userId: true,
      visibility: true,
      showMrr: true,
      showRevenue: true,
      showStats: true,
      showAvgCommission: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // If project is PRIVATE, only owner or marketers with contracts can see stats
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const isOwner = authUser?.id === project.userId;

  // Check if user is a marketer with an approved contract for this project
  let hasContract = false;
  if (authUser?.id && !isOwner) {
    const contract = await prisma.contract.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: authUser.id,
        },
      },
      select: { status: true },
    });
    hasContract = contract?.status === "APPROVED";
  }

  // Allow access if user is owner OR has an approved contract
  const hasAccess = isOwner || hasContract;
  if (project.visibility === "PRIVATE" && !hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active marketers count
  const activeMarketers = await prisma.coupon.count({
    where: {
      projectId,
      status: "ACTIVE",
    },
  });

  // Get total purchases count
  const purchaseCount = await prisma.purchase.count({
    where: {
      projectId,
      status: "PAID",
    },
  });

  // Get average commission percentage
  const avgCommissionAgg = await prisma.coupon.aggregate({
    where: {
      projectId,
      status: "ACTIVE",
    },
    _avg: {
      commissionPercent: true,
    },
  });

  const avgCommissionPercent = avgCommissionAgg._avg.commissionPercent || 0;

  // Get average paid commission amount (in cents)
  const avgPaidCommissionAgg = await prisma.purchase.aggregate({
    where: {
      projectId,
      status: "PAID",
    },
    _avg: {
      commissionAmount: true,
    },
  });

  // Get revenue stats
  const totalRevenueAgg = await prisma.purchase.aggregate({
    where: {
      projectId,
      status: "PAID",
    },
    _sum: {
      amount: true,
    },
  });

  const affiliateRevenueAgg = await prisma.purchase.aggregate({
    where: {
      projectId,
      status: "PAID",
      couponId: { not: null },
    },
    _sum: {
      amount: true,
    },
  });

  // Get MRR (approximate as last 30 days revenue)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30DaysRevenue = await prisma.purchase.aggregate({
    where: {
      projectId,
      status: "PAID",
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: {
      amount: true,
    },
  });

  // Get revenue timeline (last 30 days)
  const purchases = await prisma.purchase.findMany({
    where: {
      projectId,
      status: "PAID",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      amount: true,
      couponId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group purchases by day
  const dailyRevenue = new Map<string, { total: number; affiliate: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    dailyRevenue.set(dateKey, { total: 0, affiliate: 0 });
  }

  for (const purchase of purchases) {
    const dateKey = purchase.createdAt.toISOString().split("T")[0];
    const existing = dailyRevenue.get(dateKey) || { total: 0, affiliate: 0 };
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
    // Return -1 for hidden stats (not owner/contract holder and visibility setting is false)
    // Return null for missing data (owner/contract holder can see but no data exists)
    // Return actual value when visible
    // Marketers with contracts should see all stats (like owners)
    activeMarketers: project.showStats || hasAccess ? activeMarketers : -1,
    totalPurchases: project.showStats || hasAccess ? purchaseCount : -1,
    avgCommissionPercent:
      project.showAvgCommission || hasAccess
        ? Math.round(Number(avgCommissionPercent))
        : -1,
    avgPaidCommission: project.showStats || hasAccess ? avgPaidCommission : -1,
    totalRevenue:
      project.showRevenue || hasAccess
        ? (totalRevenueAgg._sum.amount ?? 0) / 100
        : -1,
    affiliateRevenue:
      project.showRevenue || hasAccess
        ? (affiliateRevenueAgg._sum.amount ?? 0) / 100
        : -1,
    mrr:
      project.showMrr || hasAccess
        ? (last30DaysRevenue._sum.amount ?? 0) / 100
        : -1,
    revenueTimeline: project.showRevenue || hasAccess ? revenueTimeline : null,
  };

  return NextResponse.json({ data: stats });
}
