"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserMetadata } from "@/lib/services/user-metadata";

export type ApiUser = {
  id: string;
  role: "creator" | "marketer";
  name: string;
  email: string;
  stripeConnectedAccountId?: string | null;
  stripeCustomerId?: string | null;
  autoChargeEnabled?: boolean | null;
  onboardingStatus?: string | null;
  onboardingData?: {
    capabilities?: Record<string, string | null>;
    requirements?: {
      errors?: Array<{
        code?: string | null;
        reason?: string | null;
        requirement?: string | null;
      }>;
      past_due?: string[];
      currently_due?: string[];
      eventually_due?: string[];
      disabled_reason?: string | null;
      current_deadline?: string | null;
      pending_verification?: string[];
    };
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
  } | null;
  metadata?: UserMetadata | null;
  visibility?: "PUBLIC" | "GHOST" | "PRIVATE";
};

export function useUser(userId?: string | null) {
  return useQuery<ApiUser | null>({
    queryKey: ["user", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data ?? null;
    },
  });
}

export type UpdateUserMetadataPayload = {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  specialties?: string[] | null;
  focusArea?: string | null;
  socialMedia?: {
    x?: { handle: string; followerCount?: number; verified?: boolean } | null;
    linkedin?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
    github?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
    youtube?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
    instagram?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
  };
};

export type FounderProfileProject = {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  revenue: number | -1; // -1 means hidden by visibility settings
  commissions: number | -1; // -1 means hidden by visibility settings
  mrr: number | -1; // -1 means hidden by visibility settings
  marketers: number | -1; // -1 means hidden by visibility settings
  sales: number | -1; // -1 means hidden by visibility settings
  createdAt: string | Date;
};

export type FounderProfile = {
  user: ApiUser & { createdAt?: string };
  projects: FounderProfileProject[];
  stats: {
    totalRevenue: number;
    totalCommissions: number;
    combinedMRR: number;
    activeMarketers: number;
    totalProjects: number;
    totalSales: number;
    growth: string;
  };
};

export function useFounderProfile(userId?: string | null) {
  return useQuery<FounderProfile | null>({
    queryKey: ["founder-profile", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;

      // Fetch user data
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) return null;
      const userPayload = await userResponse.json();
      const user = userPayload?.data;
      if (!user || user.role !== "creator") return null;

      // Fetch creator dashboard data
      const dashboardResponse = await fetch(
        `/api/creator/dashboard?userId=${userId}`
      );
      if (!dashboardResponse.ok) return null;
      const dashboardPayload = await dashboardResponse.json();
      const dashboard = dashboardPayload?.data;
      if (!dashboard) return null;

      // Fetch project details and stats for each project
      const projectsWithStats = await Promise.all(
        dashboard.projects.map(
          async (project: {
            id: string;
            name: string;
            metrics: {
              totalRevenue: number;
              affiliateShareOwed: number;
            } | null;
            marketerCount: number;
            createdAt: string | Date;
          }) => {
            const [projectResponse, statsResponse] = await Promise.all([
              fetch(`/api/projects/${project.id}`),
              fetch(`/api/projects/${project.id}/public-stats`),
            ]);

            const projectDetails = projectResponse.ok
              ? (await projectResponse.json())?.data
              : null;
            const projectStats = statsResponse.ok
              ? (await statsResponse.json())?.data
              : null;

            // Handle visibility: -1 means hidden, null means no data, number means actual value
            const getValue = (
              value: number | null | -1 | undefined,
              fallback: number | -1 = -1
            ): number | -1 => {
              if (value === -1) return -1; // Hidden by visibility settings
              if (value === null || value === undefined) return fallback;
              return value;
            };

            return {
              id: project.id,
              name: project.name, // Already redacted by dashboard API
              category: projectDetails?.category || "Other",
              logoUrl:
                projectDetails?.logoUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  project.name.substring(0, 2)
                )}&background=6366F1&color=fff`,
              // Use stats API values which respect visibility, fallback to dashboard metrics if stats unavailable
              revenue:
                projectStats?.totalRevenue !== undefined
                  ? getValue(projectStats.totalRevenue, 0)
                  : project.metrics?.totalRevenue
                  ? project.metrics.totalRevenue / 100
                  : -1,
              commissions: project.metrics?.affiliateShareOwed
                ? project.metrics.affiliateShareOwed / 100
                : -1, // Commissions are always from dashboard (internal metric)
              mrr: getValue(projectStats?.mrr, 0),
              marketers:
                projectStats?.activeMarketers !== undefined
                  ? getValue(projectStats.activeMarketers, 0)
                  : project.marketerCount || -1,
              sales: getValue(projectStats?.totalPurchases, 0),
              createdAt: project.createdAt,
            };
          }
        )
      );

      // Sort projects by revenue descending (in case API didn't sort properly)
      // Treat -1 (hidden) as 0 for sorting purposes
      projectsWithStats.sort((a, b) => {
        const revenueA = a.revenue === -1 ? 0 : a.revenue;
        const revenueB = b.revenue === -1 ? 0 : b.revenue;
        return revenueB - revenueA;
      });

      // Calculate overall stats (only include visible values, exclude -1)
      const totalRevenue = dashboard.totals.totalRevenue / 100;
      const totalCommissions = dashboard.totals.affiliateShareOwed / 100;
      const combinedMRR = projectsWithStats.reduce(
        (sum: number, p: FounderProfileProject) =>
          sum + (p.mrr === -1 ? 0 : p.mrr),
        0
      );
      const activeMarketers = projectsWithStats.reduce(
        (sum: number, p: FounderProfileProject) =>
          sum + (p.marketers === -1 ? 0 : p.marketers),
        0
      );
      const totalSales = projectsWithStats.reduce(
        (sum: number, p: FounderProfileProject) =>
          sum + (p.sales === -1 ? 0 : p.sales),
        0
      );
      const totalProjects = projectsWithStats.length;

      // Calculate growth
      let growth = "0%";
      if (dashboard.chart && dashboard.chart.length >= 2) {
        const recent = dashboard.chart
          .slice(-7)
          .reduce((sum: number, d: { revenue: number }) => sum + d.revenue, 0);
        const previous = dashboard.chart
          .slice(-14, -7)
          .reduce((sum: number, d: { revenue: number }) => sum + d.revenue, 0);
        if (previous > 0) {
          const growthPercent = ((recent - previous) / previous) * 100;
          growth = `${growthPercent >= 0 ? "+" : ""}${Math.round(
            growthPercent
          )}%`;
        }
      }

      return {
        user,
        projects: projectsWithStats,
        stats: {
          totalRevenue,
          totalCommissions,
          combinedMRR,
          activeMarketers,
          totalProjects,
          totalSales,
          growth,
        },
      };
    },
  });
}

export function useUpdateUserMetadata(userId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserMetadataPayload) => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Wrap payload in metadata key as expected by the API
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update profile");
      }

      return data.data as ApiUser;
    },
    onSuccess: (updatedUser) => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["user", userId ?? "none"] });
      // Also update the cache directly for immediate UI update
      queryClient.setQueryData(["user", userId ?? "none"], updatedUser);
    },
  });
}
