import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type PublicProjectStats = {
  activeMarketers: number;
  totalPurchases: number;
  avgCommissionPercent: number | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      marketerCommissionPercent: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [activeMarketers, purchaseCount, avgCommission] = await Promise.all([
    // Count unique marketers with active coupons for this project
    prisma.coupon.groupBy({
      by: ["marketerId"],
      where: {
        projectId,
        status: "ACTIVE",
      },
    }).then((groups) => groups.length),

    // Count total purchases
    prisma.purchase.count({
      where: { projectId },
    }),

    // Calculate average commission from coupons (or use project default)
    prisma.coupon.aggregate({
      where: {
        projectId,
        status: "ACTIVE",
      },
      _avg: {
        commissionPercent: true,
      },
    }),
  ]);

  // Use average from coupons, or fall back to project default
  const avgCommissionPercent =
    avgCommission._avg.commissionPercent != null
      ? Number(avgCommission._avg.commissionPercent) * 100
      : Number(project.marketerCommissionPercent) * 100;

  const stats: PublicProjectStats = {
    activeMarketers,
    totalPurchases: purchaseCount,
    avgCommissionPercent: Math.round(avgCommissionPercent),
  };

  return NextResponse.json({ data: stats });
}
