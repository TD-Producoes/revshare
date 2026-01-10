import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthUserOptional } from "@/lib/auth";
import { redactProjectData } from "@/lib/services/visibility";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ founderId: string }> }
) {
  const { founderId } = await params;
  const authUser = await getAuthUserOptional();

  const user = await prisma.user.findUnique({
    where: { id: founderId },
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

  if (!user || user.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const isSelf = authUser?.id === user.id;
  if (user.visibility === "PRIVATE" && !isSelf) {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const isGhost = user.visibility === "GHOST" && !isSelf;
  const publicUser = {
    id: user.id,
    name: isGhost ? "Anonymous Founder" : user.name,
    email: isGhost ? null : user.email,
    createdAt: user.createdAt.toISOString(),
    metadata: isGhost ? null : user.metadata,
  };

  const projects = await prisma.project.findMany({
    where: { userId: founderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
      createdAt: true,
      visibility: true,
      showMrr: true,
      showRevenue: true,
      showStats: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const visibleProjects = projects
    .map((project) => redactProjectData(project, isSelf))
    .filter((project): project is NonNullable<typeof project> => project !== null);

  if (visibleProjects.length === 0) {
    return NextResponse.json({
      data: {
        user: publicUser,
        projects: [],
        stats: {
          totalRevenue: 0,
          totalCommissions: 0,
          combinedMRR: 0,
          activeMarketers: 0,
          totalProjects: 0,
          totalSales: 0,
          growth: "0%",
        },
      },
    });
  }

  const projectIds = visibleProjects.map((project) => project.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [purchaseTotals, mrrTotals, salesTotals, marketerTotals] =
    await Promise.all([
      prisma.purchase.groupBy({
        by: ["projectId"],
        where: {
          projectId: { in: projectIds },
          status: "PAID",
        },
        _sum: {
          amount: true,
          commissionAmount: true,
        },
      }),
      prisma.purchase.groupBy({
        by: ["projectId"],
        where: {
          projectId: { in: projectIds },
          status: "PAID",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.purchase.groupBy({
        by: ["projectId"],
        where: {
          projectId: { in: projectIds },
          status: "PAID",
        },
        _count: {
          _all: true,
        },
      }),
      prisma.coupon.groupBy({
        by: ["projectId"],
        where: {
          projectId: { in: projectIds },
          status: "ACTIVE",
        },
        _count: {
          _all: true,
        },
      }),
    ]);

  const revenueByProject = new Map(
    purchaseTotals.map((row) => [row.projectId, row._sum.amount ?? 0])
  );
  const commissionsByProject = new Map(
    purchaseTotals.map((row) => [row.projectId, row._sum.commissionAmount ?? 0])
  );
  const mrrByProject = new Map(
    mrrTotals.map((row) => [row.projectId, row._sum.amount ?? 0])
  );
  const salesByProject = new Map(
    salesTotals.map((row) => [row.projectId, row._count._all ?? 0])
  );
  const marketersByProject = new Map(
    marketerTotals.map((row) => [row.projectId, row._count._all ?? 0])
  );

  const projectsWithStats = visibleProjects.map((project) => {
    const revenue = revenueByProject.get(project.id) ?? 0;
    const commissions = commissionsByProject.get(project.id) ?? 0;
    const mrr = mrrByProject.get(project.id) ?? 0;
    const sales = salesByProject.get(project.id) ?? 0;
    const marketers = marketersByProject.get(project.id) ?? 0;

    const revenueValue =
      !isSelf && !project.showRevenue ? -1 : revenue / 100;
    const commissionsValue =
      !isSelf && !project.showRevenue ? -1 : commissions / 100;
    const mrrValue = !isSelf && !project.showMrr ? -1 : mrr / 100;
    const salesValue = !isSelf && !project.showStats ? -1 : sales;
    const marketersValue = !isSelf && !project.showStats ? -1 : marketers;

    return {
      id: project.id,
      name: project.name,
      category: project.category || "Other",
      logoUrl: project.logoUrl || "",
      revenue: revenueValue,
      commissions: commissionsValue,
      mrr: mrrValue,
      marketers: marketersValue,
      sales: salesValue,
      createdAt: project.createdAt.toISOString(),
    };
  });

  projectsWithStats.sort((a, b) => {
    const revenueA = a.revenue === -1 ? 0 : a.revenue;
    const revenueB = b.revenue === -1 ? 0 : b.revenue;
    return revenueB - revenueA;
  });

  const totalRevenue = projectsWithStats.reduce(
    (sum, project) => sum + (project.revenue === -1 ? 0 : project.revenue),
    0
  );
  const totalCommissions = projectsWithStats.reduce(
    (sum, project) =>
      sum + (project.commissions === -1 ? 0 : project.commissions),
    0
  );
  const combinedMRR = projectsWithStats.reduce(
    (sum, project) => sum + (project.mrr === -1 ? 0 : project.mrr),
    0
  );
  const activeMarketers = projectsWithStats.reduce(
    (sum, project) =>
      sum + (project.marketers === -1 ? 0 : project.marketers),
    0
  );
  const totalSales = projectsWithStats.reduce(
    (sum, project) => sum + (project.sales === -1 ? 0 : project.sales),
    0
  );

  const today = new Date();
  const startRecent = new Date(today);
  startRecent.setDate(today.getDate() - 6);
  startRecent.setHours(0, 0, 0, 0);

  const startPrevious = new Date(startRecent);
  startPrevious.setDate(startPrevious.getDate() - 7);
  startPrevious.setHours(0, 0, 0, 0);

  const [recentRevenueAgg, previousRevenueAgg] = await Promise.all([
    prisma.purchase.aggregate({
      where: {
        projectId: { in: projectIds },
        status: "PAID",
        createdAt: { gte: startRecent },
      },
      _sum: { amount: true },
    }),
    prisma.purchase.aggregate({
      where: {
        projectId: { in: projectIds },
        status: "PAID",
        createdAt: { gte: startPrevious, lt: startRecent },
      },
      _sum: { amount: true },
    }),
  ]);

  const recentRevenue = recentRevenueAgg._sum.amount ?? 0;
  const previousRevenue = previousRevenueAgg._sum.amount ?? 0;
  let growth = "0%";
  if (previousRevenue > 0) {
    const growthPercent =
      ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    growth = `${growthPercent >= 0 ? "+" : ""}${Math.round(growthPercent)}%`;
  }

  return NextResponse.json({
    data: {
      user: publicUser,
      projects: projectsWithStats,
      stats: {
        totalRevenue,
        totalCommissions,
        combinedMRR,
        activeMarketers,
        totalProjects: projectsWithStats.length,
        totalSales,
        growth,
      },
    },
  });
}
