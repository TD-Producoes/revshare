import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Leaderboard project with stats
export type LeaderboardProject = {
  id: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
  revenue: number; // Total revenue in dollars
  marketers: number; // Active marketers count
  commission: number; // Total commission paid in dollars
  growth: string; // Growth percentage as string (e.g., "+20%")
};

export async function GET() {
  // Get all projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
    },
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Fetch stats for all projects in parallel
  const projectStats = await Promise.all(
    projects.map(async (project) => {
      // Get active marketers count
      const activeMarketers = await prisma.coupon.groupBy({
        by: ["marketerId"],
        where: {
          projectId: project.id,
          status: "ACTIVE",
        },
      });

      // Get total revenue (all time)
      const totalRevenueAgg = await prisma.purchase.aggregate({
        where: { projectId: project.id },
        _sum: { amount: true },
      });

      // Get total commission (affiliate revenue)
      const affiliateRevenueAgg = await prisma.purchase.aggregate({
        where: { projectId: project.id, couponId: { not: null } },
        _sum: { amount: true },
      });

      // Get revenue for last 30 days (current period)
      const currentPeriodRevenue = await prisma.purchase.aggregate({
        where: {
          projectId: project.id,
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      });

      // Get revenue for previous 30 days (previous period for growth calculation)
      const previousPeriodRevenue = await prisma.purchase.aggregate({
        where: {
          projectId: project.id,
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
        _sum: { amount: true },
      });

      const totalRevenue = (totalRevenueAgg._sum.amount ?? 0) / 100; // Convert cents to dollars
      const commission = (affiliateRevenueAgg._sum.amount ?? 0) / 100;
      const currentRevenue = (currentPeriodRevenue._sum.amount ?? 0) / 100;
      const previousRevenue = (previousPeriodRevenue._sum.amount ?? 0) / 100;

      // Calculate growth percentage
      let growth = "0%";
      if (previousRevenue > 0) {
        const growthPercent =
          ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        growth = `${growthPercent >= 0 ? "+" : ""}${Math.round(
          growthPercent
        )}%`;
      } else if (currentRevenue > 0) {
        growth = "+100%"; // New project with revenue
      }

      return {
        id: project.id,
        name: project.name,
        category: project.category ?? "Other",
        logoUrl: project.logoUrl,
        revenue: totalRevenue,
        marketers: activeMarketers.length,
        commission,
        growth,
      };
    })
  );

  // Sort by revenue (descending) and return top projects
  const sortedProjects = projectStats
    .filter((p) => p.revenue > 0) // Only show projects with revenue
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10

  return NextResponse.json({ data: sortedProjects });
}
