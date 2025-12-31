"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Notification = {
  id: string;
  userId: string;
  eventId?: string | null;
  type: string;
  title: string;
  message?: string | null;
  data?: Record<string, unknown> | null;
  status: "UNREAD" | "READ" | "ARCHIVED";
  readAt?: string | Date | null;
  createdAt: string | Date;
};

export function useNotifications(userId?: string | null, limit = 10) {
  return useQuery<{ data: Notification[]; unreadCount: number }>({
    queryKey: ["notifications", userId ?? "none", limit],
    enabled: Boolean(userId),
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: userId ?? "",
        limit: String(limit),
      });
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch notifications.");
      }
      return response.json();
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { notificationId: string; userId: string }) => {
      const response = await fetch(`/api/notifications/${payload.notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: payload.userId, status: "READ" }),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => null);
        throw new Error(payloadError?.error ?? "Failed to update notification.");
      }
      return response.json();
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", variables.userId],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const response = await fetch("/api/notifications/mark-all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: payload.userId }),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => null);
        throw new Error(payloadError?.error ?? "Failed to mark notifications.");
      }
      return response.json();
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", variables.userId],
      });
    },
  });
}
