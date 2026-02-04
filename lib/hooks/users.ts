"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserMetadata } from "@/lib/services/user-metadata";

export type ApiUser = {
  id: string;
  role: "founder" | "marketer";
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
  metadata?: UserMetadata | null;
  visibility?: "PUBLIC" | "GHOST" | "PRIVATE";
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

export type UpdateUserMetadataPayload = {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  specialties?: string[] | null;
  categories?: string[] | null;
  focusArea?: string | null;
  socialMedia?: {
    x?: { handle: string; followerCount?: number; verified?: boolean } | null;
    linkedin?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
    github?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
    youtube?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
    instagram?: {
      handle: string;
      followerCount?: number;
      verified?: boolean;
    } | null;
  };
};

export type FounderProfileProject = {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  revenue: number | -1; // -1 means hidden by visibility settings
  commissions: number | -1; // -1 means hidden by visibility settings
  mrr: number | -1; // -1 means hidden by visibility settings
  marketers: number | -1; // -1 means hidden by visibility settings
  sales: number | -1; // -1 means hidden by visibility settings
  createdAt: string | Date;
};

export type FounderProfile = {
  user: ApiUser & { createdAt?: string };
  projects: FounderProfileProject[];
  stats: {
    totalRevenue: number;
    totalCommissions: number;
    combinedMRR: number;
    activeMarketers: number;
    totalProjects: number;
    totalSales: number;
    growth: string;
  };
};

export function useFounderProfile(userId?: string | null) {
  return useQuery<FounderProfile | null>({
    queryKey: ["founder-profile", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;

      const response = await fetch(`/api/founders/${userId}/public-profile`);
      if (!response.ok) return null;
      const payload = await response.json();
      return payload?.data ?? null;
    },
  });
}

export function useUpdateUserMetadata(userId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserMetadataPayload) => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Wrap payload in metadata key as expected by the API
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update profile");
      }

      return data.data as ApiUser;
    },
    onSuccess: (updatedUser) => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["user", userId ?? "none"] });
      // Also update the cache directly for immediate UI update
      queryClient.setQueryData(["user", userId ?? "none"], updatedUser);
    },
  });
}
