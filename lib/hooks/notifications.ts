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

export type NotificationPreference = {
  userId: string;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl: string | null;
};

export type NotificationsFeedResponse = {
  data: Notification[];
  unreadCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
};

export function useNotificationsFeed(params: {
  userId?: string | null;
  status?: "UNREAD" | "READ" | "ARCHIVED";
  page: number;
  pageSize: number;
}) {
  const { userId, status, page, pageSize } = params;

  return useQuery<NotificationsFeedResponse>({
    queryKey: [
      "notifications-feed",
      userId ?? "none",
      status ?? "all",
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
      if (status) {
        query.set("status", status);
      }
      const response = await fetch(`/api/notifications?${query.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch notifications.");
      }
      return response.json();
    },
  });
}

export function useNotificationPreferences(userId?: string | null) {
  return useQuery<{ data: NotificationPreference }>({
    queryKey: ["notification-preferences", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: userId ?? "",
      });
      const response = await fetch(
        `/api/notifications/preferences?${params.toString()}`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch preferences.");
      }
      return response.json();
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: NotificationPreference) => {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => null);
        throw new Error(payloadError?.error ?? "Failed to update preferences.");
      }
      return response.json();
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["notification-preferences", variables.userId],
      });
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
      await queryClient.invalidateQueries({
        queryKey: ["notifications-feed", variables.userId],
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
      await queryClient.invalidateQueries({
        queryKey: ["notifications-feed", variables.userId],
      });
    },
  });
}
