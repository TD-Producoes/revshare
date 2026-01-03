import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  redactMarketerData,
  redactProjectData,
} from "@/lib/services/visibility";

export type PublicMarketerProfile = {
  user: {
    id: string;
    name: string | null; // null in GHOST mode
    email: string | null; // null in GHOST mode
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
    revenue: number | -1; // -1 means hidden by visibility settings
    earnings: number | -1; // -1 means hidden by visibility settings
    sales: number | -1; // -1 means hidden by visibility settings
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
  metrics: {
    // Summary totals from all snapshots
    summary: {
      totalProjectRevenue: number;
      totalAffiliateRevenue: number;
      totalCommissionOwed: number;
      totalPurchases: number;
      totalCustomers: number;
    };
    // Daily timeline (last 30 days)
    dailyTimeline: Array<{
      date: string;
      projectRevenue: number;
      affiliateRevenue: number;
      commissionOwed: number;
      purchases: number;
      customers: number;
    }>;
    // Per-project metrics breakdown
    projectMetrics: Array<{
      projectId: string;
      projectName: string;
      totalProjectRevenue: number;
      totalAffiliateRevenue: number;
      totalCommissionOwed: number;
      totalPurchases: number;
      totalCustomers: number;
    }>;
  };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketerId: string }> }
) {
  const { marketerId } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

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
      visibility: true,
    },
  });

  if (!user || user.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const isSelf = authUser?.id === user.id;
  if (user.visibility === "PRIVATE" && !isSelf) {
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
        metrics: {
          summary: {
            totalProjectRevenue: 0,
            totalAffiliateRevenue: 0,
            totalCommissionOwed: 0,
            totalPurchases: 0,
            totalCustomers: 0,
          },
          dailyTimeline: [],
          projectMetrics: [],
        },
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

  // Get projects with details and visibility settings
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
      userId: true,
      visibility: true,
      showRevenue: true,
      showStats: true,
      website: true,
      imageUrls: true,
      description: true,
      about: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
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

  // Check which projects the authenticated user has contracts with (if any)
  const userContractMap = new Map<string, boolean>();
  if (authUser?.id) {
    const userContracts = await prisma.contract.findMany({
      where: {
        userId: authUser.id,
        projectId: { in: projectIds },
        status: "APPROVED",
      },
      select: { projectId: true },
    });
    userContracts.forEach((contract) => {
      userContractMap.set(contract.projectId, true);
    });
  }

  // Build projects list with visibility redaction
  const projectsList = projects
    .map((project) => {
      // Check if the authenticated user is the project owner or has a contract with the project
      const isProjectOwner = authUser?.id === project.userId;
      const hasProjectContract = userContractMap.get(project.id) ?? false;
      const hasProjectAccess = isProjectOwner || hasProjectContract;

      // Redact project data based on visibility (unless user has access)
      const redacted = redactProjectData(project, hasProjectAccess);

      // Filter out PRIVATE projects (unless user has access)
      if (!redacted) {
        return null;
      }

      const stats = projectStats.get(project.id) ?? {
        revenue: 0,
        earnings: 0,
        sales: 0,
      };
      const commissionPercent = contractMap.get(project.id);
      const commission =
        commissionPercent != null ? Number(commissionPercent) * 100 : 0;

      // Determine if stats should be hidden based on visibility settings
      // Marketers with contracts should see all stats (like owners)
      const shouldHideRevenue =
        !project.showRevenue &&
        !hasProjectAccess &&
        project.visibility !== "PUBLIC";
      const shouldHideStats =
        !project.showStats &&
        !hasProjectAccess &&
        project.visibility !== "PUBLIC";

      return {
        id: redacted.id,
        name: redacted.name, // Will be "Anonymous Project" for GHOST mode
        category: redacted.category ?? "Other",
        logoUrl: redacted.logoUrl, // Will be null for GHOST mode
        revenue: shouldHideRevenue ? -1 : stats.revenue / 100, // Convert cents to dollars, -1 if hidden
        earnings: shouldHideRevenue ? -1 : stats.earnings / 100, // -1 if hidden
        sales: shouldHideStats ? -1 : stats.sales, // -1 if hidden
        commission: Math.round(commission),
        joinedDate:
          joinedDateMap.get(project.id)?.toISOString() ??
          new Date().toISOString(),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Sort by revenue (treat -1 as 0 for sorting)
  projectsList.sort((a, b) => {
    const revenueA = a.revenue === -1 ? 0 : a.revenue;
    const revenueB = b.revenue === -1 ? 0 : b.revenue;
    return revenueB - revenueA;
  });

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

  // Get recent commissions (last 5) - use redacted project names
  const recentCommissions = purchases.slice(0, 5).map((purchase) => {
    const project = projectsList.find((proj) => proj.id === purchase.projectId);
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

  // Fetch MarketerMetricsSnapshot data
  const metricsSnapshots = await prisma.marketerMetricsSnapshot.findMany({
    where: {
      marketerId,
      projectId: { in: projectIds },
    },
    select: {
      id: true,
      projectId: true,
      date: true,
      projectRevenueDay: true,
      affiliateRevenueDay: true,
      commissionOwedDay: true,
      purchasesCountDay: true,
      customersCountDay: true,
    },
    orderBy: { date: "desc" },
  });

  // Calculate metrics summary (totals from all snapshots)
  const metricsSummary = {
    totalProjectRevenue: 0,
    totalAffiliateRevenue: 0,
    totalCommissionOwed: 0,
    totalPurchases: 0,
    totalCustomers: 0,
  };

  for (const snapshot of metricsSnapshots) {
    metricsSummary.totalProjectRevenue += snapshot.projectRevenueDay;
    metricsSummary.totalAffiliateRevenue += snapshot.affiliateRevenueDay;
    metricsSummary.totalCommissionOwed += snapshot.commissionOwedDay;
    metricsSummary.totalPurchases += snapshot.purchasesCountDay;
    // Note: customersCountDay is already a count, not individual IDs
    // We'll use the max value per day to avoid double counting
  }

  // Convert from cents to dollars for revenue/commission
  metricsSummary.totalProjectRevenue = metricsSummary.totalProjectRevenue / 100;
  metricsSummary.totalAffiliateRevenue =
    metricsSummary.totalAffiliateRevenue / 100;
  metricsSummary.totalCommissionOwed = metricsSummary.totalCommissionOwed / 100;

  // Build daily timeline (last 30 days)
  const dailyTimeline: Array<{
    date: string;
    projectRevenue: number;
    affiliateRevenue: number;
    commissionOwed: number;
    purchases: number;
    customers: number;
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group snapshots by date
  const snapshotsByDate = new Map<string, typeof metricsSnapshots>();
  for (const snapshot of metricsSnapshots) {
    const dateKey = snapshot.date.toISOString().split("T")[0];
    if (!snapshotsByDate.has(dateKey)) {
      snapshotsByDate.set(dateKey, []);
    }
    snapshotsByDate.get(dateKey)!.push(snapshot);
  }

  // Build timeline for last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];

    const daySnapshots = snapshotsByDate.get(dateKey) ?? [];

    // Aggregate all projects for this day
    const dayMetrics = {
      projectRevenue: 0,
      affiliateRevenue: 0,
      commissionOwed: 0,
      purchases: 0,
      customers: 0,
    };

    for (const snapshot of daySnapshots) {
      dayMetrics.projectRevenue += snapshot.projectRevenueDay;
      dayMetrics.affiliateRevenue += snapshot.affiliateRevenueDay;
      dayMetrics.commissionOwed += snapshot.commissionOwedDay;
      dayMetrics.purchases += snapshot.purchasesCountDay;
      // For customers, use the max value across projects for the day
      // (assuming customersCountDay represents unique customers per project per day)
      dayMetrics.customers = Math.max(
        dayMetrics.customers,
        snapshot.customersCountDay
      );
    }

    // Convert from cents to dollars
    dayMetrics.projectRevenue = dayMetrics.projectRevenue / 100;
    dayMetrics.affiliateRevenue = dayMetrics.affiliateRevenue / 100;
    dayMetrics.commissionOwed = dayMetrics.commissionOwed / 100;

    dailyTimeline.push({
      date: dateKey,
      ...dayMetrics,
    });
  }

  // Build per-project metrics breakdown
  const projectMetricsMap = new Map<
    string,
    {
      projectId: string;
      projectName: string;
      totalProjectRevenue: number;
      totalAffiliateRevenue: number;
      totalCommissionOwed: number;
      totalPurchases: number;
      totalCustomers: number;
    }
  >();

  for (const snapshot of metricsSnapshots) {
    // Use redacted project name from projectsList
    const redactedProject = projectsList.find(
      (p) => p.id === snapshot.projectId
    );
    const existing = projectMetricsMap.get(snapshot.projectId) ?? {
      projectId: snapshot.projectId,
      projectName: redactedProject?.name ?? "Unknown",
      totalProjectRevenue: 0,
      totalAffiliateRevenue: 0,
      totalCommissionOwed: 0,
      totalPurchases: 0,
      totalCustomers: 0,
    };

    existing.totalProjectRevenue += snapshot.projectRevenueDay;
    existing.totalAffiliateRevenue += snapshot.affiliateRevenueDay;
    existing.totalCommissionOwed += snapshot.commissionOwedDay;
    existing.totalPurchases += snapshot.purchasesCountDay;
    existing.totalCustomers = Math.max(
      existing.totalCustomers,
      snapshot.customersCountDay
    );

    projectMetricsMap.set(snapshot.projectId, existing);
  }

  // Convert from cents to dollars and build array
  const projectMetrics = Array.from(projectMetricsMap.values()).map((pm) => ({
    ...pm,
    totalProjectRevenue: pm.totalProjectRevenue / 100,
    totalAffiliateRevenue: pm.totalAffiliateRevenue / 100,
    totalCommissionOwed: pm.totalCommissionOwed / 100,
  }));

  // Redact user data based on visibility settings before building profile
  const userForProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    metadata: user.metadata,
    visibility: user.visibility,
  };

  const redactedUser = redactMarketerData(userForProfile, isSelf);

  // If user is PRIVATE and not self, redactedUser will be null - already handled above
  if (!redactedUser) {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const profile: PublicMarketerProfile = {
    user: {
      id: redactedUser.id,
      name: redactedUser.name ?? null, // Can be null in GHOST mode
      email: redactedUser.email ?? null, // Can be null in GHOST mode
      createdAt: redactedUser.createdAt,
      metadata: redactedUser.metadata,
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
    metrics: {
      summary: metricsSummary,
      dailyTimeline,
      projectMetrics,
    },
  };

  return NextResponse.json({ data: profile });
}
