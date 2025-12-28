"use client";

import { useQuery } from "@tanstack/react-query";

export type ApiProject = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  creatorStripeAccountId?: string | null;
  platformCommissionPercent?: string | number | null;
  marketerCommissionPercent?: string | number | null;
  createdAt?: string | null;
};

export type ProjectStats = {
  projectName: string;
  stripe: {
    totalRevenue: number;
    charges: number;
    newCustomers: number;
  };
  platform: {
    totalTrackedRevenue: number;
    totalCommission: number;
    purchases: number;
  };
  coupons: {
    revenue: number;
    commission: number;
    purchases: number;
  };
};

export function useProjects(userId?: string | null) {
  return useQuery<ApiProject[]>({
    queryKey: ["projects", userId ?? "all"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const payload = await response.json();
      const projects = Array.isArray(payload?.data) ? payload.data : [];
      return userId ? projects.filter((project) => project.userId === userId) : projects;
    },
  });
}

export function useProject(id: string) {
  return useQuery<ApiProject | null>({
    queryKey: ["projects", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data ?? null;
    },
  });
}

export function useProjectStats(id: string) {
  return useQuery<ProjectStats>({
    queryKey: ["project-stats", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}/stats`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch project stats.");
      }
      return payload?.data as ProjectStats;
    },
  });
}
