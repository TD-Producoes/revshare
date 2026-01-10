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
      status: "APPROVED",
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

  const [marketer, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: marketerId },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.contract.findMany({
      where: { userId: marketerId, status: "APPROVED" },
      select: { project: { select: { id: true, name: true } } },
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

  const [timeline, totals] = await Promise.all([
    prisma.marketerMetricsSnapshot.findMany({
      where: { ...baseWhere, date: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        date: true,
        projectRevenueDay: true,
        affiliateRevenueDay: true,
        commissionOwedDay: true,
        purchasesCountDay: true,
        customersCountDay: true,
      },
    }),
    prisma.marketerMetricsSnapshot.aggregate({
      where: baseWhere,
      _sum: {
        projectRevenueDay: true,
        affiliateRevenueDay: true,
        commissionOwedDay: true,
        purchasesCountDay: true,
        customersCountDay: true,
      },
    }),
  ]);

  const summary = {
    projectRevenue: totals._sum.projectRevenueDay ?? 0,
    affiliateRevenue: totals._sum.affiliateRevenueDay ?? 0,
    commissionOwed: totals._sum.commissionOwedDay ?? 0,
    purchasesCount: totals._sum.purchasesCountDay ?? 0,
    customersCount: totals._sum.customersCountDay ?? 0,
  };

  return NextResponse.json({
    data: {
      marketer,
      projects: projects.map((entry) => entry.project),
      summary,
      timeline: timeline.map((entry) => ({
        date: entry.date.toISOString(),
        projectRevenue: entry.projectRevenueDay,
        affiliateRevenue: entry.affiliateRevenueDay,
        commissionOwed: entry.commissionOwedDay,
        purchasesCount: entry.purchasesCountDay,
        customersCount: entry.customersCountDay,
      })),
    },
  });
}
