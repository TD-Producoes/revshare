"use client";

import { useQuery } from "@tanstack/react-query";

export type ApiProject = {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    metadata?: unknown;
  } | null;
  name: string;
  description?: string | null;
  category?: string | null;
  refundWindowDays?: number | null;
  creatorStripeAccountId?: string | null;
  currency?: string | null;
  platformCommissionPercent?: string | number | null;
  marketerCommissionPercent?: string | number | null;
  country?: string | null;
  website?: string | null;
  foundationDate?: string | Date | null;
  about?: string | null;
  features?: string[] | null;
  logoUrl?: string | null;
  imageUrls?: string[] | null;
  createdAt?: string | null;
};

export type ProjectStats = {
  projectName: string;
  stripe: {
    totalRevenue: number;
    charges: number;
    newCustomers: number;
  };
  platform: {
    totalTrackedRevenue: number;
    totalCommission: number;
    purchases: number;
  };
  coupons: {
    revenue: number;
    commission: number;
    purchases: number;
  };
};

export type ProjectPurchase = {
  id: string;
  projectId: string;
  amount: number;
  commissionAmount: number;
  currency: string;
  customerEmail: string | null;
  status: string;
  createdAt: string | Date;
  coupon: {
    id: string;
    code: string;
    percentOff: number;
    marketer: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
};

export type RevenueDataPoint = {
  date: string;
  total: number;
  affiliate: number;
};

export type PublicProjectStats = {
  activeMarketers: number;
  totalPurchases: number;
  avgCommissionPercent: number | null;
  avgPaidCommission: number | null;
  totalRevenue: number;
  affiliateRevenue: number;
  mrr: number;
  revenueTimeline: RevenueDataPoint[];
};

export function useProjects(userId?: string | null) {
  return useQuery<ApiProject[]>({
    queryKey: ["projects", userId ?? "all"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const payload = await response.json();
      const projects = Array.isArray(payload?.data) ? payload.data : [];
      return userId
        ? projects.filter((project: ApiProject) => project.userId === userId)
        : projects;
    },
  });
}

export function useProject(id?: string | null) {
  return useQuery<ApiProject | null>({
    queryKey: ["projects", id ?? "none"],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data ?? null;
    },
  });
}

export type LeaderboardProject = {
  id: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
  revenue: number;
  marketers: number;
  commission: number;
  growth: string;
};

export function useProjectsLeaderboard() {
  return useQuery<LeaderboardProject[]>({
    queryKey: ["projects-leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/projects/leaderboard");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? "Failed to fetch projects leaderboard."
        );
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useProjectStats(id: string) {
  return useQuery<ProjectStats>({
    queryKey: ["project-stats", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}/stats`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch project stats.");
      }
      return payload?.data as ProjectStats;
    },
  });
}

export function useProjectPurchases(id: string) {
  return useQuery<ProjectPurchase[]>({
    queryKey: ["project-purchases", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}/purchases`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch purchases.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function usePublicProjectStats(id?: string | null) {
  return useQuery<PublicProjectStats | null>({
    queryKey: ["public-project-stats", id ?? "none"],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/projects/${id}/public-stats`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return null;
      }
      return payload?.data as PublicProjectStats;
    },
  });
}

export type ProjectProfileUser = {
  id: string;
  name: string;
  metadata?: unknown;
  stripeConnectedAccountId?: string | null;
};

export type ProjectProfile = {
  project: ApiProject;
  stats: PublicProjectStats | null;
  user: ProjectProfileUser | null;
};

export function useProjectProfile(id?: string | null) {
  return useQuery<ProjectProfile | null>({
    queryKey: ["project-profile", id ?? "none"],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;

      // Fetch project data
      const projectResponse = await fetch(`/api/projects/${id}`);
      if (!projectResponse.ok) return null;
      const projectPayload = await projectResponse.json();
      const project = projectPayload?.data;
      if (!project) return null;

      // Fetch stats (don't fail if stats aren't available)
      let stats: PublicProjectStats | null = null;
      try {
        const statsResponse = await fetch(`/api/projects/${id}/public-stats`);
        if (statsResponse.ok) {
          const statsPayload = await statsResponse.json();
          stats = statsPayload?.data ?? null;
        }
      } catch {
        // Stats are optional
      }

      // Fetch user if exists
      let user: ProjectProfileUser | null = null;
      if (project.user?.id) {
        try {
          const userResponse = await fetch(`/api/users/${project.user.id}`);
          if (userResponse.ok) {
            const userPayload = await userResponse.json();
            user = userPayload?.data ?? null;
          }
        } catch {
          // User fetch failed, use embedded user data
          user = project.user;
        }
      }

      return { project, stats, user };
    },
  });
}
