import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redactProjectData } from "@/lib/services/visibility";
import { VisibilityMode } from "@prisma/client";

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
  // Get all projects with visibility settings
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
      visibility: true,
      showRevenue: true,
      showStats: true,
      userId: true,
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
      // Redact project data based on visibility (no owner context for public leaderboard)
      const redacted = redactProjectData(project, false);

      // Filter out PRIVATE projects
      if (!redacted) {
        return null;
      }

      // Get active marketers count (only if stats are visible)
      let activeMarketersCount = 0;
      if (
        project.showStats ||
        project.visibility === VisibilityMode.PUBLIC ||
        project.visibility === VisibilityMode.GHOST
      ) {
        const activeMarketers = await prisma.coupon.groupBy({
          by: ["marketerId"],
          where: {
            projectId: project.id,
            status: "ACTIVE",
          },
        });
        activeMarketersCount = activeMarketers.length;
      }

      // Get total revenue (all time) - only if revenue is visible
      let totalRevenue = 0;
      let commission = 0;
      let currentRevenue = 0;
      let previousRevenue = 0;

      if (
        project.showRevenue ||
        project.visibility === VisibilityMode.PUBLIC ||
        project.visibility === VisibilityMode.GHOST
      ) {
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

        totalRevenue = (totalRevenueAgg._sum.amount ?? 0) / 100; // Convert cents to dollars
        commission = (affiliateRevenueAgg._sum.amount ?? 0) / 100;
        currentRevenue = (currentPeriodRevenue._sum.amount ?? 0) / 100;
        previousRevenue = (previousPeriodRevenue._sum.amount ?? 0) / 100;
      }

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
        id: redacted.id,
        name: redacted.name, // Will be "Anonymous Project" for GHOST mode
        category: redacted.category ?? "Other",
        logoUrl: redacted.logoUrl, // Will be null for GHOST mode
        revenue: totalRevenue,
        marketers: activeMarketersCount,
        commission,
        growth,
      };
    })
  );

  // Sort by revenue (descending) and return top projects
  // Filter out null entries (PRIVATE projects) and projects with no revenue
  const sortedProjects = projectStats
    .filter((p): p is NonNullable<typeof p> => p !== null && p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10) as LeaderboardProject[]; // Top 10

  return NextResponse.json({ data: sortedProjects });
}
