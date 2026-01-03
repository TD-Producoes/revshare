"use client";

import { useQuery } from "@tanstack/react-query";

export type MarketerPurchase = {
  id: string;
  projectId: string;
  projectName: string;
  couponCode: string | null;
  percentOff: number | null;
  amount: number;
  commissionAmount: number;
  currency: string;
  customerEmail: string | null;
  commissionStatus: string;
  refundEligibleAt: string | Date | null;
  status: string;
  createdAt: string | Date;
};

export type MarketerStats = {
  totalPurchases: number;
  totalRevenue: number;
  totalEarnings: number;
  pendingEarnings: number;
};

export type MarketerAdjustment = {
  id: string;
  projectId: string;
  projectName: string;
  purchaseId: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  createdAt: string | Date;
};

export type MarketerAdjustmentsResponse = {
  data: MarketerAdjustment[];
  pendingTotal: number;
};

export type MarketerTransfer = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripeTransferId: string | null;
  failureReason: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  projects: string[];
};

export type MarketerTransfersResponse = {
  totals: {
    paid: number;
    pending: number;
    failed: number;
  };
  currency: string | null;
  transfers: MarketerTransfer[];
};

export type MarketerProjectStats = {
  projectId: string;
  projectName: string;
  commissionPercent: number;
  totals: {
    purchases: number;
    revenue: number;
    commission: number;
  };
  commissions: {
    awaitingCreator: { count: number; amount: number };
    awaitingRefundWindow: { count: number; amount: number };
    ready: { count: number; amount: number };
    paid: { count: number; amount: number };
  };
};

export function useMarketerPurchases(userId?: string | null) {
  return useQuery<MarketerPurchase[]>({
    queryKey: ["marketer-purchases", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/marketer/purchases?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch purchases.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useMarketerStats(userId?: string | null) {
  return useQuery<MarketerStats>({
    queryKey: ["marketer-stats", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/marketer/stats?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch stats.");
      }
      const payload = await response.json();
      return payload?.data as MarketerStats;
    },
  });
}

export type MarketerMetrics = {
  summary: {
    projectRevenue: number;
    affiliateRevenue: number;
    commissionOwed: number;
    purchasesCount: number;
    customersCount: number;
  };
  timeline: Array<{
    date: string;
    projectRevenue: number;
    affiliateRevenue: number;
    commissionOwed: number;
    purchasesCount: number;
    customersCount: number;
  }>;
};

export function useMarketerMetrics(
  userId?: string | null,
  projectId?: string | null,
  days = 30
) {
  return useQuery<MarketerMetrics>({
    queryKey: ["marketer-metrics", userId ?? "none", projectId ?? "all", days],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("Missing userId");
      }
      const params = new URLSearchParams({ userId, days: String(days) });
      if (projectId) {
        params.set("projectId", projectId);
      }
      const response = await fetch(
        `/api/marketer/metrics?${params.toString()}`
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch marketer metrics.");
      }
      return payload?.data as MarketerMetrics;
    },
  });
}

export function useMarketerAdjustments(userId?: string | null) {
  return useQuery<MarketerAdjustmentsResponse>({
    queryKey: ["marketer-adjustments", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/marketer/adjustments?userId=${userId}`
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch adjustments.");
      }
      const payload = await response.json();
      return {
        data: Array.isArray(payload?.data) ? payload.data : [],
        pendingTotal:
          typeof payload?.pendingTotal === "number" ? payload.pendingTotal : 0,
      };
    },
  });
}

export function useMarketerTransfers(userId?: string | null) {
  return useQuery<MarketerTransfersResponse>({
    queryKey: ["marketer-transfers", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/marketer/transfers?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch transfers.");
      }
      const payload = await response.json();
      return payload?.data as MarketerTransfersResponse;
    },
  });
}

export function useMarketerProjectStats(
  projectId?: string | null,
  userId?: string | null
) {
  return useQuery<MarketerProjectStats>({
    queryKey: ["marketer-project-stats", projectId ?? "none", userId ?? "none"],
    enabled: Boolean(projectId && userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/marketer/projects/${projectId}/stats?userId=${userId}`
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch project stats.");
      }
      const payload = await response.json();
      return payload?.data as MarketerProjectStats;
    },
  });
}

export type PublicMarketerProfile = {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    metadata: unknown;
  };
  stats: {
    totalEarnings: number;
    totalRevenue: number;
    activeProjects: number;
    totalSales: number;
    conversionRate: number;
    avgCommission: number;
    growth: string;
  };
  projects: Array<{
    id: string;
    name: string;
    category: string | null;
    logoUrl: string | null;
    revenue: number;
    earnings: number;
    sales: number;
    commission: number;
    joinedDate: string;
  }>;
  recentCommissions: Array<{
    id: string;
    project: string;
    amount: number;
    date: string;
    status: string;
    sales: number;
  }>;
  earningsTimeline: Array<{
    month: string;
    earnings: number;
    revenue: number;
  }>;
  metrics: {
    // Summary totals from all snapshots
    summary: {
      totalProjectRevenue: number;
      totalAffiliateRevenue: number;
      totalCommissionOwed: number;
      totalPurchases: number;
      totalCustomers: number;
    };
    // Daily timeline (last 30 days)
    dailyTimeline: Array<{
      date: string;
      projectRevenue: number;
      affiliateRevenue: number;
      commissionOwed: number;
      purchases: number;
      customers: number;
    }>;
    // Per-project metrics breakdown
    projectMetrics: Array<{
      projectId: string;
      projectName: string;
      totalProjectRevenue: number;
      totalAffiliateRevenue: number;
      totalCommissionOwed: number;
      totalPurchases: number;
      totalCustomers: number;
    }>;
  };
};

export function usePublicMarketerProfile(marketerId?: string | null) {
  return useQuery<PublicMarketerProfile>({
    queryKey: ["public-marketer-profile", marketerId ?? "none"],
    enabled: Boolean(marketerId),
    queryFn: async () => {
      const response = await fetch(
        `/api/marketers/${marketerId}/public-profile`
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch marketer profile.");
      }
      const payload = await response.json();
      return payload?.data as PublicMarketerProfile;
    },
  });
}

export type LeaderboardMarketer = {
  id: string;
  name: string;
  focus: string | null;
  revenue: number;
  commission: number;
  activeProjects: number;
  trend: string;
  image: string | null;
};

export function useMarketersLeaderboard() {
  return useQuery<LeaderboardMarketer[]>({
    queryKey: ["marketers-leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/marketers/leaderboard");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? "Failed to fetch marketers leaderboard."
        );
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export type MarketerTestimonial = {
  id: string;
  contractId: string;
  creatorId: string;
  creatorName: string;
  projectId: string;
  projectName: string;
  rating: number;
  text: string | null; // null in GHOST mode to protect identity
  createdAt: string | Date;
};

export function useMarketerTestimonials(marketerId?: string | null) {
  return useQuery<MarketerTestimonial[]>({
    queryKey: ["marketer-testimonials", marketerId ?? "none"],
    enabled: Boolean(marketerId),
    queryFn: async () => {
      const response = await fetch(`/api/marketers/${marketerId}/testimonials`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch testimonials.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export type SearchMarketer = {
  id: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  specialties?: string[];
  focusArea?: string | null;
  totalEarnings: number;
  totalRevenue: number;
  activeProjects: number;
};

export type MarketersSearchFilters = {
  search?: string;
  specialties?: string[];
  earningsRanges?: string[];
  locations?: string[];
  focusAreas?: string[];
};

export function useMarketersSearch(filters: MarketersSearchFilters = {}) {
  return useQuery<SearchMarketer[]>({
    queryKey: ["marketers-search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.specialties && filters.specialties.length > 0) {
        params.append("specialties", filters.specialties.join(","));
      }
      if (filters.earningsRanges && filters.earningsRanges.length > 0) {
        params.append("earningsRanges", filters.earningsRanges.join(","));
      }
      if (filters.locations && filters.locations.length > 0) {
        params.append("locations", filters.locations.join(","));
      }
      if (filters.focusAreas && filters.focusAreas.length > 0) {
        params.append("focusAreas", filters.focusAreas.join(","));
      }

      const response = await fetch(
        `/api/marketers/search?${params.toString()}`
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to search marketers.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export type MarketerFilterOptions = {
  specialties: string[];
  locations: string[];
  focusAreas: string[];
};

export function useMarketersFilterOptions() {
  return useQuery<MarketerFilterOptions>({
    queryKey: ["marketers-filter-options"],
    queryFn: async () => {
      const response = await fetch("/api/marketers/filter-options");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch filter options.");
      }
      const payload = await response.json();
      return (
        payload?.data ?? { specialties: [], locations: [], focusAreas: [] }
      );
    },
  });
}
