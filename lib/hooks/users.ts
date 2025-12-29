"use client";

import { useQuery } from "@tanstack/react-query";

export type ApiUser = {
  id: string;
  role: "creator" | "marketer";
  name: string;
  email: string;
  stripeConnectedAccountId?: string | null;
  stripeCustomerId?: string | null;
  autoChargeEnabled?: boolean | null;
  onboardingStatus?: string | null;
  onboardingData?: {
    capabilities?: Record<string, string | null>;
    requirements?: {
      errors?: Array<{
        code?: string | null;
        reason?: string | null;
        requirement?: string | null;
      }>;
      past_due?: string[];
      currently_due?: string[];
      eventually_due?: string[];
      disabled_reason?: string | null;
      current_deadline?: string | null;
      pending_verification?: string[];
    };
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
  } | null;
};

export function useUser(userId?: string | null) {
  return useQuery<ApiUser | null>({
    queryKey: ["user", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data ?? null;
    },
  });
}
