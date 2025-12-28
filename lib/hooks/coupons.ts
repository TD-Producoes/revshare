"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Coupon = {
  id: string;
  projectId: string;
  code: string;
  percentOff: number;
  commissionPercent: number;
  status: string;
  claimedAt: string | Date;
};

export type ProjectCoupon = {
  id: string;
  code: string;
  percentOff: number;
  commissionPercent: number;
  status: string;
  claimedAt: string | Date;
  marketer: {
    id: string;
    name: string;
    email: string;
    stripeConnectedAccountId?: string | null;
  };
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
      marketerId: string;
      percentOff?: number;
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
