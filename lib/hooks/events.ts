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
  project?: {
    id: string;
    name: string | null;
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

export type EventLogResponse = {
  data: ProjectEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export function useEventLog(params: {
  userId?: string | null;
  role?: "creator" | "marketer";
  projectId?: string | null;
  actor?: string;
  eventType?: string;
  page: number;
  pageSize: number;
}) {
  const { userId, role, projectId, actor, eventType, page, pageSize } = params;

  return useQuery<EventLogResponse>({
    queryKey: [
      "event-log",
      userId ?? "none",
      role ?? "any",
      projectId ?? "all",
      actor ?? "",
      eventType ?? "all",
      page,
      pageSize,
    ],
    enabled: Boolean(userId),
    queryFn: async () => {
      const query = new URLSearchParams({
        userId: userId ?? "",
        page: String(page),
        pageSize: String(pageSize),
      });
      if (role) {
        query.set("role", role);
      }
      if (projectId) {
        query.set("projectId", projectId);
      }
      if (actor && actor.trim().length > 0) {
        query.set("actor", actor.trim());
      }
      if (eventType) {
        query.set("eventType", eventType);
      }
      const response = await fetch(`/api/events?${query.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch events.");
      }
      return response.json();
    },
  });
}
