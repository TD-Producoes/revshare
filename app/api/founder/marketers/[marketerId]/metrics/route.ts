import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
  projectId: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ marketerId: string }> },
) {
  const { marketerId } = await params;
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    days: searchParams.get("days") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const creator = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creatorProjects = await prisma.project.findMany({
    where: { userId: creator.id },
    select: { id: true },
  });
  const projectIds = creatorProjects.map((project) => project.id);
  if (projectIds.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hasAccess = await prisma.contract.findFirst({
    where: {
      userId: marketerId,
      status: { in: ["APPROVED", "PAUSED"] },
      projectId: { in: projectIds },
    },
    select: { id: true },
  });
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lookbackDays = parsed.data.days ?? 30;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [marketer, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: marketerId },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.contract.findMany({
      where: { userId: marketerId, status: { in: ["APPROVED", "PAUSED"] } },
      select: {
        status: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (!marketer) {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const projectId = parsed.data.projectId ?? undefined;
  const baseWhere = {
    marketerId,
    ...(projectId ? { projectId } : {}),
  };

  // Determine which project(s) to query for revenue
  const revenueProjectIds = projectId ? [projectId] : projectIds;

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
      // Get per-day project revenue from MetricsSnapshot
      prisma.metricsSnapshot.findMany({
        where: {
          projectId: { in: revenueProjectIds },
          date: { gte: since },
        },
        orderBy: { date: "asc" },
        select: {
          date: true,
          totalRevenueDay: true,
          purchasesCountDay: true,
          uniqueCustomersDay: true,
        },
      }),
      // Get total project revenue from MetricsSnapshot
      prisma.metricsSnapshot.aggregate({
        where: { projectId: { in: revenueProjectIds } },
        _sum: { totalRevenueDay: true },
      }),
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

  const summary = {
    projectRevenue: projectRevenueTotals._sum.totalRevenueDay ?? 0,
    affiliateRevenue: totals._sum.affiliateRevenueDay ?? 0,
    commissionOwed: totals._sum.commissionOwedDay ?? 0,
    purchasesCount: totals._sum.purchasesCountDay ?? 0,
    customersCount: totals._sum.customersCountDay ?? 0,
    clicksCount: totals._sum.clicksCountDay ?? 0,
    installsCount: totals._sum.installsCountDay ?? 0,
  };

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
      marketer,
      projects: projects.map((entry) => ({
        ...entry.project,
        status: entry.status,
      })),
      summary,
      timeline: fullTimeline,
    },
  });
}
