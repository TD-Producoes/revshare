"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PaymentMethod = {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  bankName: string | null;
  isDefault: boolean;
  createdAt: string;
};

export function usePaymentMethods(userId?: string | null) {
  return useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/creator/payment-methods?userId=${userId}`,
      );
      if (!response.ok) {
        return [];
      }
      const payload = await response.json();
      return payload?.data ?? [];
    },
  });
}

export function useSetDefaultPaymentMethod(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      if (!userId) {
        throw new Error("User is required.");
      }
      const response = await fetch(
        `/api/creator/payment-methods/${paymentMethodId}/default`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to set default payment method.");
      }
      return payload?.data ?? null;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["payment-methods", userId ?? "none"],
      });
    },
  });
}

export function useRemovePaymentMethod(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      if (!userId) {
        throw new Error("User is required.");
      }
      const response = await fetch(
        `/api/creator/payment-methods/${paymentMethodId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to remove payment method.");
      }
      return payload?.data ?? null;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["payment-methods", userId ?? "none"],
      });
    },
  });
}
