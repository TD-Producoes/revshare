import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redactProjectData } from "@/lib/services/visibility";
import { createClient } from "@/lib/supabase/server";

type DayTotals = {
  revenue: number;
  affiliateRevenue: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Get authenticated user to determine if they're the owner
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      userId: true,
      marketerCommissionPercent: true,
      platformCommissionPercent: true,
      createdAt: true,
      visibility: true,
      showRevenue: true,
      showStats: true,
      logoUrl: true,
      website: true,
      imageUrls: true,
      about: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const projectIds = projects.map((project) => project.id);

  const latestSnapshots = await prisma.metricsSnapshot.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { date: "desc" },
    distinct: ["projectId"],
  });

  const totalRevenueByProject = new Map(
    latestSnapshots.map((row) => [row.projectId, row.totalRevenue]),
  );
  const affiliateRevenueByProject = new Map(
    latestSnapshots.map((row) => [row.projectId, row.affiliateRevenue]),
  );
  const affiliateShareByProject = new Map(
    latestSnapshots.map((row) => [row.projectId, row.affiliateShareOwed]),
  );
  const platformFeeByProject = new Map(
    latestSnapshots.map((row) => [row.projectId, row.platformFee]),
  );
  const mrrByProject = new Map(
    latestSnapshots.map((row) => [row.projectId, row.mrr]),
  );
  const customersByProject = new Map(
    latestSnapshots.map((row) => [row.projectId, row.uniqueCustomers]),
  );

  let totalRevenue = 0;
  let affiliateRevenue = 0;
  let affiliateShareOwed = 0;
  let platformFee = 0;
  let mrr = 0;

  const projectMetrics = new Map<
    string,
    {
      totalRevenue: number;
      affiliateRevenue: number;
      affiliateShareOwed: number;
    }
  >();

  for (const project of projects) {
    totalRevenue += totalRevenueByProject.get(project.id) ?? 0;
    affiliateRevenue += affiliateRevenueByProject.get(project.id) ?? 0;
    affiliateShareOwed += affiliateShareByProject.get(project.id) ?? 0;
    platformFee += platformFeeByProject.get(project.id) ?? 0;
    mrr += mrrByProject.get(project.id) ?? 0;
    projectMetrics.set(project.id, {
      totalRevenue: totalRevenueByProject.get(project.id) ?? 0,
      affiliateRevenue: affiliateRevenueByProject.get(project.id) ?? 0,
      affiliateShareOwed: affiliateShareByProject.get(project.id) ?? 0,
    });
  }

  const now = new Date();
  const startCurrent = new Date(now);
  startCurrent.setDate(now.getDate() - 29);
  startCurrent.setHours(0, 0, 0, 0);

  const startPrevious = new Date(startCurrent);
  startPrevious.setDate(startCurrent.getDate() - 30);
  startPrevious.setHours(0, 0, 0, 0);

  const snapshots = await prisma.metricsSnapshot.findMany({
    where: {
      projectId: { in: projectIds },
      date: {
        gte: startPrevious,
      },
    },
    orderBy: { date: "asc" },
  });

  const contractCounts = await prisma.contract.groupBy({
    by: ["projectId"],
    where: {
      projectId: { in: projectIds },
      status: "APPROVED",
    },
    _count: {
      _all: true,
    },
  });
  const marketerCountByProject = new Map(
    contractCounts.map((row) => [row.projectId, row._count._all]),
  );

  const chartMap = new Map<string, DayTotals>();
  let currentPeriodRevenue = 0;
  let previousPeriodRevenue = 0;

  const snapshotsByProject = new Map<string, typeof snapshots>();
  snapshots.forEach((snapshot) => {
    const existing = snapshotsByProject.get(snapshot.projectId) ?? [];
    existing.push(snapshot);
    snapshotsByProject.set(snapshot.projectId, existing);
  });

  snapshots.forEach((snapshot) => {
    const dayKey = snapshot.date.toISOString().slice(0, 10);
    const existing = chartMap.get(dayKey) ?? {
      revenue: 0,
      affiliateRevenue: 0,
    };
    existing.revenue += snapshot.totalRevenueDay;
    existing.affiliateRevenue += snapshot.affiliateRevenueDay;
    chartMap.set(dayKey, existing);

    if (snapshot.date >= startCurrent) {
      currentPeriodRevenue += snapshot.totalRevenueDay;
    } else if (snapshot.date >= startPrevious) {
      previousPeriodRevenue += snapshot.totalRevenueDay;
    }
  });

  const previousMrrByProject = new Map<string, number>();
  const previousTarget = startCurrent;
  let previousMrrTotal = 0;
  snapshotsByProject.forEach((rows, projectId) => {
    const previousSnapshot = rows
      .filter((row) => row.date < previousTarget)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    const value = previousSnapshot?.mrr ?? 0;
    previousMrrByProject.set(projectId, value);
    previousMrrTotal += value;
  });

  const revenueTrend =
    previousPeriodRevenue > 0
      ? Math.round(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 1000) / 10
      : null;
  const mrrTrend =
    previousMrrTotal > 0
      ? Math.round(((mrr - previousMrrTotal) / previousMrrTotal) * 1000) / 10
      : null;

  const chart = Array.from(chartMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, totals]) => ({
      date,
      revenue: Math.round((totals.revenue / 100) * 100) / 100,
      affiliateRevenue: Math.round((totals.affiliateRevenue / 100) * 100) / 100,
    }));

  // Determine if the requester is the owner
  const isOwner = authUser?.id === userId;

  const projectData = projects
    .map((project) => {
      // Redact project data based on visibility (if not owner)
      const redacted = redactProjectData(project, isOwner);
      if (!redacted) {
        return null; // PRIVATE project, filter out
      }

      const metrics = projectMetrics.get(project.id);
      const marketerCount = marketerCountByProject.get(project.id) ?? 0;

      return {
        id: redacted.id,
        name: redacted.name, // Will be "Anonymous Project" for GHOST mode
        description: redacted.description,
        userId: redacted.userId,
        marketerCommissionPercent: project.marketerCommissionPercent,
        platformCommissionPercent: project.platformCommissionPercent,
        createdAt: project.createdAt,
        metrics: metrics
          ? {
              totalRevenue: metrics.totalRevenue,
              affiliateRevenue: metrics.affiliateRevenue,
              mrr: mrrByProject.get(project.id) ?? 0,
              activeSubscribers: customersByProject.get(project.id) ?? 0,
            }
          : null,
        marketerCount,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Sort projects by total revenue descending
  const sortedProjects = projectData.sort((a, b) => {
    const revenueA = a.metrics?.totalRevenue ?? 0;
    const revenueB = b.metrics?.totalRevenue ?? 0;
    return revenueB - revenueA;
  });

  return NextResponse.json({
    data: {
      totals: {
        totalRevenue,
        affiliateRevenue,
        affiliateShareOwed,
        platformFee,
        mrr,
      },
      chart,
      trends: {
        totalRevenue: revenueTrend,
        mrr: mrrTrend,
      },
      projects: sortedProjects,
    },
  });
}
