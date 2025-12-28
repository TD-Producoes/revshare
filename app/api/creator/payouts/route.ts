import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const PLATFORM_FEE_PERCENT = 0.05;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true },
  });
  const projectIds = projects.map((project) => project.id);

  if (projectIds.length === 0) {
    return NextResponse.json({
      data: {
        totals: {
          totalCommissions: 0,
          paidCommissions: 0,
          pendingCommissions: 0,
          platformFee: 0,
        },
        payouts: [],
      },
    });
  }

  const purchases = await prisma.purchase.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    include: {
      coupon: {
        select: {
          marketerId: true,
          marketer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  let totalCommissions = 0;
  let paidCommissions = 0;
  let pendingCommissions = 0;

  const marketerMap = new Map<
    string,
    {
      marketerId: string;
      marketerName: string;
      marketerEmail: string | null;
      projectIds: Set<string>;
      totalEarnings: number;
      paidEarnings: number;
      pendingEarnings: number;
    }
  >();

  for (const purchase of purchases) {
    if (!purchase.coupon?.marketerId) {
      continue;
    }
    const marketerId = purchase.coupon.marketerId;
    const marketer = purchase.coupon.marketer;
    const existing =
      marketerMap.get(marketerId) ??
      {
        marketerId,
        marketerName: marketer?.name ?? "Unknown",
        marketerEmail: marketer?.email ?? null,
        projectIds: new Set<string>(),
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
      };

    existing.projectIds.add(purchase.projectId);
    existing.totalEarnings += purchase.commissionAmount;
    totalCommissions += purchase.commissionAmount;

    if (purchase.status === "PAID") {
      existing.paidEarnings += purchase.commissionAmount;
      paidCommissions += purchase.commissionAmount;
    } else if (purchase.status === "PENDING") {
      existing.pendingEarnings += purchase.commissionAmount;
      pendingCommissions += purchase.commissionAmount;
    }

    marketerMap.set(marketerId, existing);
  }

  const payouts = Array.from(marketerMap.values())
    .map((entry) => ({
      marketerId: entry.marketerId,
      marketerName: entry.marketerName,
      marketerEmail: entry.marketerEmail,
      projectCount: entry.projectIds.size,
      totalEarnings: entry.totalEarnings,
      paidEarnings: entry.paidEarnings,
      pendingEarnings: entry.pendingEarnings,
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  const platformFee = Math.floor(totalCommissions * PLATFORM_FEE_PERCENT);

  return NextResponse.json({
    data: {
      totals: {
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        platformFee,
      },
      payouts,
    },
  });
}
