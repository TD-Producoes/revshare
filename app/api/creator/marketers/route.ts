import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  creatorId: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    creatorId: searchParams.get("creatorId") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing creatorId", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { creatorId } = parsed.data;

  const projects = await prisma.project.findMany({
    where: { userId: creatorId },
    select: { id: true },
  });
  const projectIds = projects.map((project) => project.id);

  if (projectIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const [contracts, metrics, projectCounts] = await Promise.all([
    prisma.contract.findMany({
      where: { projectId: { in: projectIds }, status: "APPROVED" },
      select: { userId: true },
    }),
    prisma.marketerMetricsSnapshot.groupBy({
      by: ["marketerId"],
      where: { projectId: { in: projectIds } },
      _sum: {
        affiliateRevenueDay: true,
        commissionOwedDay: true,
        purchasesCountDay: true,
        customersCountDay: true,
      },
    }),
    prisma.contract.groupBy({
      by: ["userId"],
      where: { projectId: { in: projectIds }, status: "APPROVED" },
      _count: { _all: true },
    }),
  ]);

  const marketerIds = Array.from(new Set(contracts.map((row) => row.userId)));

  if (marketerIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const marketers = await prisma.user.findMany({
    where: { id: { in: marketerIds }, role: "marketer" },
    select: { id: true, name: true, email: true },
  });

  const metricsMap = new Map(
    metrics.map((entry) => [entry.marketerId, entry._sum]),
  );
  const projectsMap = new Map(
    projectCounts.map((entry) => [entry.userId, entry._count._all]),
  );

  const response = marketers.map((marketer) => {
    const sums = metricsMap.get(marketer.id);
    return {
      id: marketer.id,
      name: marketer.name,
      email: marketer.email,
      projectCount: projectsMap.get(marketer.id) ?? 0,
      affiliateRevenue: sums?.affiliateRevenueDay ?? 0,
      commissionOwed: sums?.commissionOwedDay ?? 0,
      purchasesCount: sums?.purchasesCountDay ?? 0,
      customersCount: sums?.customersCountDay ?? 0,
    };
  });

  return NextResponse.json({ data: response });
}
