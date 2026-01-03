"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Coupon = {
  id: string;
  projectId: string;
  templateId: string;
  code: string;
  percentOff: number;
  commissionPercent: number;
  status: string;
  claimedAt: string | Date;
  template?: {
    name: string;
    startAt: string | Date | null;
    endAt: string | Date | null;
    status: string;
  };
};

export type ProjectCoupon = {
  id: string;
  templateId: string;
  code: string;
  percentOff: number;
  commissionPercent: number;
  refundWindowDays?: number | null;
  status: string;
  claimedAt: string | Date;
  template?: {
    name: string;
    startAt: string | Date | null;
    endAt: string | Date | null;
    status: string;
  };
  marketer: {
    id: string;
    name: string;
    email: string;
    stripeConnectedAccountId?: string | null;
  };
};

export type CouponTemplate = {
  id: string;
  name: string;
  description?: string | null;
  percentOff: number;
  durationType?: "ONCE" | "REPEATING";
  durationInMonths?: number | null;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  maxRedemptions?: number | null;
  productIds?: string[] | null;
  allowedMarketerIds?: string[] | null;
  status: string;
  createdAt: string | Date;
};

export function useCouponsForMarketer(userId?: string | null) {
  return useQuery<Coupon[]>({
    queryKey: ["coupons", "marketer", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/coupons?marketerId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch coupons.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useClaimCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      templateId: string;
      marketerId: string;
      code?: string;
    }) => {
      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to claim coupon.");
      }
      return data?.data ?? null;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["coupons", "marketer", variables.marketerId],
      });
    },
  });
}

export function useProjectCoupons(projectId?: string | null) {
  return useQuery<ProjectCoupon[]>({
    queryKey: ["project-coupons", projectId ?? "none"],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/coupons`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch coupons.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useProjectCouponTemplates(
  projectId?: string | null,
  includeAll = false,
  marketerId?: string | null,
) {
  return useQuery<CouponTemplate[]>({
    queryKey: [
      "coupon-templates",
      projectId ?? "none",
      includeAll,
      marketerId ?? "none",
    ],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const params = new URLSearchParams({
        includeAll: String(includeAll),
      });
      if (marketerId) {
        params.set("marketerId", marketerId);
      }
      const response = await fetch(
        `/api/projects/${projectId}/coupon-templates?${params.toString()}`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch coupon templates.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}
