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

  const purchases = await prisma.purchase.findMany({
    where: {
      projectId: { in: projectIds },
      commissionStatus: { notIn: ["REFUNDED", "CHARGEBACK"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      projectId: true,
      amount: true,
      commissionAmount: true,
      createdAt: true,
      couponId: true,
      coupon: {
        select: {
          marketerId: true,
        },
      },
    },
  });

  let totalRevenue = 0;
  let affiliateRevenue = 0;
  let affiliateShareOwed = 0;
  let platformFee = 0;

  const projectMetrics = new Map<
    string,
    {
      totalRevenue: number;
      affiliateRevenue: number;
      affiliateShareOwed: number;
      marketers: Set<string>;
    }
  >();

  const platformPercentByProject = new Map(
    projects.map((project) => [
      project.id,
      Number(project.platformCommissionPercent) || 0,
    ])
  );

  for (const purchase of purchases) {
    totalRevenue += purchase.amount;
    affiliateShareOwed += purchase.commissionAmount;
    if (purchase.couponId) {
      affiliateRevenue += purchase.amount;
    }
    const platformPercent =
      platformPercentByProject.get(purchase.projectId) ?? 0;
    platformFee += Math.round(purchase.commissionAmount * platformPercent);

    const existing = projectMetrics.get(purchase.projectId) ?? {
      totalRevenue: 0,
      affiliateRevenue: 0,
      affiliateShareOwed: 0,
      marketers: new Set<string>(),
    };

    existing.totalRevenue += purchase.amount;
    existing.affiliateShareOwed += purchase.commissionAmount;
    if (purchase.couponId) {
      existing.affiliateRevenue += purchase.amount;
      if (purchase.coupon?.marketerId) {
        existing.marketers.add(purchase.coupon.marketerId);
      }
    }

    projectMetrics.set(purchase.projectId, existing);
  }

  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const chartMap = new Map<string, DayTotals>();
  for (const purchase of purchases) {
    if (purchase.createdAt < start) {
      continue;
    }
    const dayKey = purchase.createdAt.toISOString().slice(0, 10);
    const existing = chartMap.get(dayKey) ?? {
      revenue: 0,
      affiliateRevenue: 0,
    };
    existing.revenue += purchase.amount;
    if (purchase.couponId) {
      existing.affiliateRevenue += purchase.amount;
    }
    chartMap.set(dayKey, existing);
  }

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
      const marketerCount = metrics ? metrics.marketers.size : 0;

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
              mrr: 0,
              activeSubscribers: 0,
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
        mrr: 0,
      },
      chart,
      projects: sortedProjects,
    },
  });
}
