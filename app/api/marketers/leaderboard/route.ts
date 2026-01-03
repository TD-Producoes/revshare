import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redactMarketerData } from "@/lib/services/visibility";
import { VisibilityMode } from "@prisma/client";

// Leaderboard marketer with stats
export type LeaderboardMarketer = {
  id: string;
  name: string | null; // Can be null for GHOST mode
  focus: string | null; // Focus area from metadata
  revenue: number; // Total revenue generated in dollars
  commission: number; // Total earnings in dollars
  activeProjects: number; // Number of active projects
  trend: string; // Growth percentage as string (e.g., "+12%")
  image: string | null; // Avatar URL from X profile or generated
};

export async function GET() {
  // Get all marketers (users with role "marketer") with visibility settings
  const marketers = await prisma.user.findMany({
    where: { role: "marketer" },
    select: {
      id: true,
      name: true,
      email: true,
      metadata: true,
      visibility: true,
    },
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Fetch stats for all marketers in parallel
  const marketerStats = await Promise.all(
    marketers.map(async (marketer) => {
      // Redact marketer data based on visibility (no self context for public leaderboard)
      const redacted = redactMarketerData(marketer, false);
      
      // Filter out PRIVATE marketers
      if (!redacted) {
        return null;
      }

      // Get all purchases for this marketer
      const purchases = await prisma.purchase.findMany({
        where: { coupon: { marketerId: marketer.id } },
        select: {
          amount: true,
          commissionAmount: true,
          createdAt: true,
          projectId: true,
        },
      });

      // Get unique active projects (projects with active contracts)
      const activeContracts = await prisma.contract.findMany({
        where: {
          userId: marketer.id,
          status: "APPROVED",
        },
        select: {
          projectId: true,
        },
      });

      const activeProjectIds = new Set(activeContracts.map((c) => c.projectId));

      // Calculate total revenue and commission
      const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0) / 100; // Convert cents to dollars
      const totalCommission = purchases.reduce((sum, p) => sum + p.commissionAmount, 0) / 100;

      // Calculate growth (compare last 30 days vs previous 30 days)
      const recentRevenue = purchases
        .filter((p) => p.createdAt >= thirtyDaysAgo)
        .reduce((sum, p) => sum + p.amount, 0);
      const previousRevenue = purchases
        .filter(
          (p) => p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo,
        )
        .reduce((sum, p) => sum + p.amount, 0);

      let trend = "0%";
      if (previousRevenue > 0) {
        const growthPercent = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
        trend = `${growthPercent >= 0 ? "+" : ""}${Math.round(growthPercent)}%`;
      } else if (recentRevenue > 0) {
        trend = "+100%";
      }

      // Get focus area from metadata (only if not redacted)
      let focus: string | null = null;
      let image: string | null = null;

      if (redacted.metadata && typeof redacted.metadata === "object") {
        const metadata = redacted.metadata as Record<string, unknown>;
        if (typeof metadata.focusArea === "string") {
          focus = metadata.focusArea;
        }

        // Get X profile for avatar (only if not redacted in GHOST mode)
        if (
          metadata.socialMedia &&
          typeof metadata.socialMedia === "object"
        ) {
          const socialMedia = metadata.socialMedia as Record<string, unknown>;
          if (socialMedia.x && typeof socialMedia.x === "object") {
            const xProfile = socialMedia.x as Record<string, unknown>;
            if (typeof xProfile.handle === "string") {
              const handle = xProfile.handle.replace(/^@/, "");
              image = `https://unavatar.io/x/${handle}`;
            }
          }
        }
      }

      // Generate fallback avatar if no X profile
      // For GHOST mode, use a generic anonymous avatar
      if (!image) {
        if (redacted.name) {
          const initials = redacted.name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          image = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366F1&color=fff`;
        } else {
          // Anonymous avatar for GHOST mode
          image = `https://ui-avatars.com/api/?name=Anonymous&background=6366F1&color=fff`;
        }
      }

      return {
        id: redacted.id,
        name: redacted.name, // Will be null for GHOST mode
        focus: focus || "General",
        revenue: totalRevenue,
        commission: totalCommission,
        activeProjects: activeProjectIds.size,
        trend,
        image,
      };
    }),
  );

  // Sort by revenue (descending) and return top marketers
  // Filter out null entries (PRIVATE marketers) and marketers with no revenue
  const sortedMarketers = marketerStats
    .filter((m): m is NonNullable<typeof m> => m !== null && m.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10) as LeaderboardMarketer[]; // Top 10

  return NextResponse.json({ data: sortedMarketers });
}

