"use client";

import { useQuery } from "@tanstack/react-query";

export type ProjectEvent = {
  id: string;
  type: string;
  actorId?: string | null;
  projectId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string | Date;
  actor?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

export function useProjectEvents(projectId?: string | null, limit = 30) {
  return useQuery<ProjectEvent[]>({
    queryKey: ["project-events", projectId ?? "none", limit],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/events?limit=${limit}`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch events.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}
