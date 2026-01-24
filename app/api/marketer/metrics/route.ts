import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const querySchema = z.object({
  userId: z.string().min(1),
  projectId: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId") ?? "",
    projectId: searchParams.get("projectId") ?? undefined,
    days: searchParams.get("days") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, projectId } = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, userId);
  } catch (error) {
    return authErrorResponse(error);
  }
  const lookbackDays = parsed.data.days ?? 30;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const marketer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const baseWhere = {
    marketerId: userId,
    ...(projectId ? { projectId } : {}),
  };

  // Determine which project(s) the marketer is associated with
  let projectIds: string[] = [];
  if (projectId) {
    projectIds = [projectId];
  } else {
    const distinctProjects =
      await prisma.marketerMetricsSnapshot.findMany({
        where: { marketerId: userId },
        distinct: ["projectId"],
        select: { projectId: true },
      });
    projectIds = distinctProjects.map((p) => p.projectId);
  }

  const [timeline, totals, projectRevenueTimeline, projectRevenueTotals] =
    await Promise.all([
      prisma.marketerMetricsSnapshot.findMany({
        where: { ...baseWhere, date: { gte: since } },
        orderBy: { date: "asc" },
        select: {
          date: true,
          affiliateRevenueDay: true,
          commissionOwedDay: true,
          purchasesCountDay: true,
          customersCountDay: true,
          clicksCountDay: true,
          installsCountDay: true,
        },
      }),
      prisma.marketerMetricsSnapshot.aggregate({
        where: baseWhere,
        _sum: {
          affiliateRevenueDay: true,
          commissionOwedDay: true,
          purchasesCountDay: true,
          customersCountDay: true,
          clicksCountDay: true,
          installsCountDay: true,
        },
      }),
      // Get per-day project revenue from MetricsSnapshot (actual project revenue)
      projectIds.length > 0
        ? prisma.metricsSnapshot.findMany({
            where: {
              projectId: { in: projectIds },
              date: { gte: since },
            },
            orderBy: { date: "asc" },
            select: {
              date: true,
              totalRevenueDay: true,
              purchasesCountDay: true,
              uniqueCustomersDay: true,
            },
          })
        : Promise.resolve([]),
      // Get total project revenue from MetricsSnapshot
      projectIds.length > 0
        ? prisma.metricsSnapshot.aggregate({
            where: { projectId: { in: projectIds } },
            _sum: { totalRevenueDay: true },
          })
        : Promise.resolve({ _sum: { totalRevenueDay: null } }),
    ]);

  // Build a map of date -> project revenue for the timeline
  const projectRevenueByDate = new Map<string, number>();
  const projectPurchasesByDate = new Map<string, number>();
  const projectCustomersByDate = new Map<string, number>();
  for (const entry of projectRevenueTimeline) {
    const dateStr = entry.date.toISOString().split("T")[0];
    const current = projectRevenueByDate.get(dateStr) ?? 0;
    projectRevenueByDate.set(
      dateStr,
      current + (entry.totalRevenueDay ?? 0),
    );
    const purchasesCurrent = projectPurchasesByDate.get(dateStr) ?? 0;
    projectPurchasesByDate.set(
      dateStr,
      purchasesCurrent + (entry.purchasesCountDay ?? 0),
    );
    const customersCurrent = projectCustomersByDate.get(dateStr) ?? 0;
    projectCustomersByDate.set(
      dateStr,
      customersCurrent + (entry.uniqueCustomersDay ?? 0),
    );
  }

  const timelineMap = new Map(
    timeline.map((entry) => {
      const dateStr = entry.date.toISOString().split("T")[0];
      return [
        dateStr,
        {
          date: entry.date.toISOString(),
          projectRevenue: projectRevenueByDate.get(dateStr) ?? 0,
          affiliateRevenue: entry.affiliateRevenueDay,
          commissionOwed: entry.commissionOwedDay,
          purchasesCount: entry.purchasesCountDay,
          projectPurchasesCount: projectPurchasesByDate.get(dateStr) ?? 0,
          customersCount: entry.customersCountDay,
          projectCustomersCount: projectCustomersByDate.get(dateStr) ?? 0,
          clicksCount: entry.clicksCountDay ?? 0,
          installsCount: entry.installsCountDay ?? 0,
        },
      ];
    }),
  );

  const fullTimeline: Array<{
    date: string;
    projectRevenue: number;
    affiliateRevenue: number;
    commissionOwed: number;
    purchasesCount: number;
    customersCount: number;
    clicksCount: number;
    installsCount: number;
  }> = [];
  const cursor = new Date(since);
  while (cursor <= today) {
    const key = cursor.toISOString().split("T")[0];
    const existing = timelineMap.get(key);
    fullTimeline.push(
      existing ?? {
        date: cursor.toISOString(),
        projectRevenue: projectRevenueByDate.get(key) ?? 0,
        affiliateRevenue: 0,
        commissionOwed: 0,
        purchasesCount: 0,
        projectPurchasesCount: projectPurchasesByDate.get(key) ?? 0,
        customersCount: 0,
        projectCustomersCount: projectCustomersByDate.get(key) ?? 0,
        clicksCount: 0,
        installsCount: 0,
      },
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return NextResponse.json({
    data: {
      summary: {
        projectRevenue: projectRevenueTotals._sum.totalRevenueDay ?? 0,
        affiliateRevenue: totals._sum.affiliateRevenueDay ?? 0,
        commissionOwed: totals._sum.commissionOwedDay ?? 0,
        purchasesCount: totals._sum.purchasesCountDay ?? 0,
        customersCount: totals._sum.customersCountDay ?? 0,
        clicksCount: totals._sum.clicksCountDay ?? 0,
        installsCount: totals._sum.installsCountDay ?? 0,
      },
      timeline: fullTimeline,
    },
  });
}
