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
        clicksCountDay: true,
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
        clicksCountDay: true,
      },
    }),
  ]);

  return NextResponse.json({
    data: {
      summary: {
        projectRevenue: totals._sum.projectRevenueDay ?? 0,
        affiliateRevenue: totals._sum.affiliateRevenueDay ?? 0,
        commissionOwed: totals._sum.commissionOwedDay ?? 0,
        purchasesCount: totals._sum.purchasesCountDay ?? 0,
        customersCount: totals._sum.customersCountDay ?? 0,
        clicksCount: totals._sum.clicksCountDay ?? 0,
      },
      timeline: timeline.map((entry) => ({
        date: entry.date.toISOString(),
        projectRevenue: entry.projectRevenueDay,
        affiliateRevenue: entry.affiliateRevenueDay,
        commissionOwed: entry.commissionOwedDay,
        purchasesCount: entry.purchasesCountDay,
        customersCount: entry.customersCountDay,
        clicksCount: entry.clicksCountDay ?? 0,
      })),
    },
  });
}
