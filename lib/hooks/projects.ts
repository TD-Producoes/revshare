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
  visibility?: "PUBLIC" | "GHOST" | "PRIVATE";
  showMrr?: boolean;
  showRevenue?: boolean;
  showStats?: boolean;
  showAvgCommission?: boolean;
  autoApproveApplications?: boolean;
  autoApproveMatchTerms?: boolean;
  autoApproveVerifiedOnly?: boolean;
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

export type ProjectMetricsSnapshot = {
  summary: {
    totalRevenue: number;
    affiliateRevenue: number;
    affiliateShareOwed?: number;
    platformFee?: number;
    mrr: number;
    activeSubscribers: number;
    affiliateMrr: number;
    affiliateSubscribers: number;
    customers: number;
    affiliateCustomers: number;
    affiliatePurchases?: number;
    directPurchases?: number;
  };
  timeline: Array<{
    date: string;
    totalRevenue: number;
    affiliateRevenue: number;
    affiliateShareOwed?: number;
    platformFee?: number;
    purchasesCount?: number;
    affiliatePurchasesCount?: number;
    directPurchasesCount?: number;
    uniqueCustomers?: number;
    affiliateCustomers?: number;
  }>;
};

export type PublicProjectStats = {
  claimedRewards?: number | null | -1; // -1 means hidden by visibility settings
  activeMarketers: number | null;
  totalPurchases: number | null;
  avgCommissionPercent: number | null;
  avgPaidCommission: number | null;
  totalRevenue: number | null;
  affiliateRevenue: number | null;
  mrr: number | null;
  revenueTimeline: RevenueDataPoint[] | null;
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
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  revenue: number;
  marketers: number;
  commission: number;
  growth: string;
  founder: {
    id: string | null;
    name: string | null;
    image: string | null;
  } | null;
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

export function useProjectMetrics(id?: string | null, days = 30) {
  return useQuery<ProjectMetricsSnapshot>({
    queryKey: ["project-metrics", id ?? "none", days],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) {
        return {
          summary: {
            totalRevenue: 0,
            affiliateRevenue: 0,
            affiliateShareOwed: 0,
            platformFee: 0,
            mrr: 0,
            activeSubscribers: 0,
            affiliateMrr: 0,
            affiliateSubscribers: 0,
            customers: 0,
            affiliateCustomers: 0,
            affiliatePurchases: 0,
            directPurchases: 0,
          },
          timeline: [],
        };
      }
      const response = await fetch(`/api/projects/${id}/metrics?days=${days}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch project metrics.");
      }
      return payload?.data as ProjectMetricsSnapshot;
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
          if (project.user) {
            user = {
              id: project.user.id,
              name: project.user.name ?? "",
              metadata: project.user.metadata,
            };
          }
        }
      }

      return { project, stats, user };
    },
  });
}

export type SearchProject = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  country: string | null;
  website: string | null;
  revenue: number | null;
  marketers: number | null;
  commission: number;
};

export type ProjectsSearchFilters = {
  search?: string;
  categories?: string[];
  revenueRanges?: string[];
  commissionRanges?: string[];
  countries?: string[];
};

export function useProjectsSearch(filters: ProjectsSearchFilters = {}) {
  return useQuery<SearchProject[]>({
    queryKey: ["projects-search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.categories && filters.categories.length > 0) {
        params.append("categories", filters.categories.join(","));
      }
      if (filters.revenueRanges && filters.revenueRanges.length > 0) {
        params.append("revenueRanges", filters.revenueRanges.join(","));
      }
      if (filters.commissionRanges && filters.commissionRanges.length > 0) {
        params.append("commissionRanges", filters.commissionRanges.join(","));
      }
      if (filters.countries && filters.countries.length > 0) {
        params.append("countries", filters.countries.join(","));
      }

      const response = await fetch(`/api/projects/search?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to search projects.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export type FilterOptions = {
  categories: string[];
  countries: string[];
};

export function useProjectsFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ["projects-filter-options"],
    queryFn: async () => {
      const response = await fetch("/api/projects/filter-options");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch filter options.");
      }
      const payload = await response.json();
      return payload?.data ?? { categories: [], countries: [] };
    },
  });
}

export type Reward = {
  id: string;
  name: string;
  description?: string | null;
  milestoneType: "NET_REVENUE" | "COMPLETED_SALES" | "ACTIVE_CUSTOMERS";
  milestoneValue: number;
  rewardType:
    | "DISCOUNT_COUPON"
    | "FREE_SUBSCRIPTION"
    | "PLAN_UPGRADE"
    | "ACCESS_PERK";
  rewardLabel?: string | null;
  rewardPercentOff?: number | null;
  rewardDurationMonths?: number | null;
  fulfillmentType: "AUTO_COUPON" | "MANUAL";
  earnLimit: "ONCE_PER_MARKETER" | "MULTIPLE";
  availabilityType: "UNLIMITED" | "FIRST_N";
  availabilityLimit?: number | null;
  visibility: "PUBLIC" | "PRIVATE";
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};

/**
 * Hook to fetch public rewards for a project
 * Returns only active, public rewards visible to marketers
 */
export function useProjectRewards(projectId?: string | null) {
  return useQuery<Reward[]>({
    queryKey: ["project-rewards", projectId ?? "none"],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/rewards`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return [];
      }
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}
