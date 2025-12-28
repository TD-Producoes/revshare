"use client";

import { useQuery } from "@tanstack/react-query";

export type CreatorPayoutTotals = {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  platformFee: number;
};

export type CreatorPayout = {
  marketerId: string;
  marketerName: string;
  marketerEmail: string | null;
  projectCount: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
};

export type CreatorDashboardTotals = {
  totalRevenue: number;
  mrr: number;
  affiliateRevenue: number;
  affiliateShareOwed: number;
  platformFee: number;
};

export type CreatorDashboardProject = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  marketerCommissionPercent: string | number | null;
  platformCommissionPercent: string | number | null;
  createdAt: string | Date;
  metrics: {
    totalRevenue: number;
    affiliateRevenue: number;
    mrr: number;
    activeSubscribers: number;
  } | null;
  marketerCount: number;
};

export type CreatorDashboard = {
  totals: CreatorDashboardTotals;
  chart: Array<{ date: string; revenue: number; affiliateRevenue: number }>;
  projects: CreatorDashboardProject[];
};

export function useCreatorPayouts(userId?: string | null) {
  return useQuery<{ totals: CreatorPayoutTotals; payouts: CreatorPayout[] }>({
    queryKey: ["creator-payouts", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/creator/payouts?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch payouts.");
      }
      const payload = await response.json();
      return payload?.data as {
        totals: CreatorPayoutTotals;
        payouts: CreatorPayout[];
      };
    },
  });
}

export function useCreatorDashboard(userId?: string | null) {
  return useQuery<CreatorDashboard>({
    queryKey: ["creator-dashboard", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/creator/dashboard?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch dashboard.");
      }
      const payload = await response.json();
      return payload?.data as CreatorDashboard;
    },
  });
}
