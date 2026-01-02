import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type PublicMarketerProfile = {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    metadata: unknown;
  };
  stats: {
    totalEarnings: number;
    totalRevenue: number;
    activeProjects: number;
    totalSales: number;
    conversionRate: number;
    avgCommission: number;
    growth: string;
  };
  projects: Array<{
    id: string;
    name: string;
    category: string | null;
    logoUrl: string | null;
    revenue: number;
    earnings: number;
    sales: number;
    commission: number;
    joinedDate: string;
  }>;
  recentCommissions: Array<{
    id: string;
    project: string;
    amount: number;
    date: string;
    status: string;
    sales: number;
  }>;
  earningsTimeline: Array<{
    month: string;
    earnings: number;
    revenue: number;
  }>;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketerId: string }> }
) {
  const { marketerId } = await params;

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: marketerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      metadata: true,
    },
  });

  if (!user || user.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  // Get all approved contracts for this marketer
  const contracts = await prisma.contract.findMany({
    where: {
      userId: marketerId,
      status: "APPROVED",
    },
    select: {
      projectId: true,
      commissionPercent: true,
      createdAt: true,
    },
  });

  const projectIds = contracts.map((c) => c.projectId);
  const contractMap = new Map(
    contracts.map((c) => [c.projectId, c.commissionPercent])
  );
  const joinedDateMap = new Map(
    contracts.map((c) => [c.projectId, c.createdAt])
  );

  if (projectIds.length === 0) {
    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          metadata: user.metadata,
        },
        stats: {
          totalEarnings: 0,
          totalRevenue: 0,
          activeProjects: 0,
          totalSales: 0,
          conversionRate: 0,
          avgCommission: 0,
          growth: "0%",
        },
        projects: [],
        recentCommissions: [],
        earningsTimeline: [],
      },
    });
  }

  // Get all purchases for this marketer
  const purchases = await prisma.purchase.findMany({
    where: {
      coupon: { marketerId },
    },
    select: {
      id: true,
      projectId: true,
      amount: true,
      commissionAmount: true,
      createdAt: true,
      commissionStatus: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get projects with details
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
    },
  });

  // Calculate stats per project
  const projectStats = new Map<
    string,
    { revenue: number; earnings: number; sales: number }
  >();

  for (const purchase of purchases) {
    const existing = projectStats.get(purchase.projectId) ?? {
      revenue: 0,
      earnings: 0,
      sales: 0,
    };
    existing.revenue += purchase.amount;
    existing.earnings += purchase.commissionAmount;
    existing.sales += 1;
    projectStats.set(purchase.projectId, existing);
  }

  // Build projects list
  const projectsList = projects.map((project) => {
    const stats = projectStats.get(project.id) ?? {
      revenue: 0,
      earnings: 0,
      sales: 0,
    };
    const commissionPercent = contractMap.get(project.id);
    const commission =
      commissionPercent != null ? Number(commissionPercent) * 100 : 0;

    return {
      id: project.id,
      name: project.name,
      category: project.category ?? "Other",
      logoUrl: project.logoUrl,
      revenue: stats.revenue / 100, // Convert cents to dollars
      earnings: stats.earnings / 100,
      sales: stats.sales,
      commission: Math.round(commission),
      joinedDate:
        joinedDateMap.get(project.id)?.toISOString() ??
        new Date().toISOString(),
    };
  });

  // Sort by revenue
  projectsList.sort((a, b) => b.revenue - a.revenue);

  // Calculate overall stats
  const totalEarnings =
    purchases.reduce((sum, p) => sum + p.commissionAmount, 0) / 100;
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0) / 100;
  const totalSales = purchases.length;
  const activeProjects = projectsList.length;

  // Calculate average commission
  const avgCommission =
    contracts.length > 0
      ? contracts.reduce((sum, c) => sum + Number(c.commissionPercent), 0) /
        contracts.length
      : 0;
  const avgCommissionPercent = Math.round(avgCommission * 100);

  // Calculate conversion rate (simplified - would need clicks data for real calculation)
  // For now, using a placeholder calculation
  const conversionRate = totalSales > 0 ? 4.8 : 0; // This would come from analytics

  // Calculate growth (compare last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentRevenue = purchases
    .filter((p) => p.createdAt >= thirtyDaysAgo)
    .reduce((sum, p) => sum + p.amount, 0);
  const previousRevenue = purchases
    .filter((p) => p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo)
    .reduce((sum, p) => sum + p.amount, 0);

  let growth = "0%";
  if (previousRevenue > 0) {
    const growthPercent =
      ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    growth = `${growthPercent >= 0 ? "+" : ""}${Math.round(growthPercent)}%`;
  } else if (recentRevenue > 0) {
    growth = "+100%";
  }

  // Build earnings timeline (last 12 months)
  const timeline: Array<{ month: string; earnings: number; revenue: number }> =
    [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthPurchases = purchases.filter(
      (p) => p.createdAt >= monthStart && p.createdAt <= monthEnd
    );

    const earnings =
      monthPurchases.reduce((sum, p) => sum + p.commissionAmount, 0) / 100;
    const revenue = monthPurchases.reduce((sum, p) => sum + p.amount, 0) / 100;

    timeline.push({
      month: monthNames[date.getMonth()],
      earnings,
      revenue,
    });
  }

  // Get recent commissions (last 5)
  const recentCommissions = purchases.slice(0, 5).map((purchase) => {
    const project = projects.find((proj) => proj.id === purchase.projectId);
    return {
      id: purchase.id,
      project: project?.name ?? "Unknown",
      amount: purchase.commissionAmount / 100,
      date: purchase.createdAt.toISOString(),
      status:
        purchase.commissionStatus === "PAID"
          ? "paid"
          : purchase.commissionStatus === "READY_FOR_PAYOUT"
          ? "ready"
          : "pending",
      sales: 1, // Simplified - would need to group by date/project
    };
  });

  const profile: PublicMarketerProfile = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      metadata: user.metadata,
    },
    stats: {
      totalEarnings,
      totalRevenue,
      activeProjects,
      totalSales,
      conversionRate,
      avgCommission: avgCommissionPercent,
      growth,
    },
    projects: projectsList,
    recentCommissions,
    earningsTimeline: timeline,
  };

  return NextResponse.json({ data: profile });
}
