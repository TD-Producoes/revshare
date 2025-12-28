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
  status: string;
  createdAt: string | Date;
};

export type MarketerStats = {
  totalPurchases: number;
  totalRevenue: number;
  totalEarnings: number;
  pendingEarnings: number;
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
