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

export function useMarketerAdjustments(userId?: string | null) {
  return useQuery<MarketerAdjustmentsResponse>({
    queryKey: ["marketer-adjustments", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/marketer/adjustments?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch adjustments.");
      }
      const payload = await response.json();
      return {
        data: Array.isArray(payload?.data) ? payload.data : [],
        pendingTotal: typeof payload?.pendingTotal === "number" ? payload.pendingTotal : 0,
      };
    },
  });
}

export function useMarketerProjectStats(
  projectId?: string | null,
  userId?: string | null,
) {
  return useQuery<MarketerProjectStats>({
    queryKey: ["marketer-project-stats", projectId ?? "none", userId ?? "none"],
    enabled: Boolean(projectId && userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/marketer/projects/${projectId}/stats?userId=${userId}`,
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
