"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ContractStatus = "pending" | "approved" | "rejected";

export type Contract = {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  commissionPercent: number;
  status: ContractStatus;
  createdAt: string | Date;
};

export function useContractsForCreator(creatorId?: string | null) {
  return useQuery<Contract[]>({
    queryKey: ["contracts", creatorId ?? "none"],
    enabled: Boolean(creatorId),
    queryFn: async () => {
      const response = await fetch(`/api/contracts?creatorId=${creatorId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch contracts.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useContractsForMarketer(userId?: string | null) {
  return useQuery<Contract[]>({
    queryKey: ["contracts", "marketer", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/contracts?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch contracts.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      contractId: string;
      creatorId: string;
      status: ContractStatus;
    }) => {
      const response = await fetch(`/api/contracts/${payload.contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: payload.creatorId,
          status: payload.status,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update contract.");
      }
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["contracts", variables.creatorId],
      });
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      userId: string;
      commissionPercent: number;
    }) => {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create contract.");
      }
      return data?.data ?? null;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["contracts", "marketer", variables.userId],
      });
    },
  });
}
