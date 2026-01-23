"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsFeed,
} from "@/lib/hooks/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type NotificationFilter = "all" | "UNREAD" | "READ" | "ARCHIVED";

const filters: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: "READ", label: "Read" },
  { value: "ARCHIVED", label: "Archived" },
];

type NotificationsPageProps = {
  expectedRole?: "founder" | "marketer";
};

export function NotificationsPage({ expectedRole }: NotificationsPageProps) {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: user, isLoading: isUserLoading } = useUser(authUserId);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const markAll = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const statusFilter = filter === "all" ? undefined : filter;

  const { data: feed, isLoading } = useNotificationsFeed({
    userId: user?.id,
    status: statusFilter,
    page,
    pageSize,
  });

  const notifications = feed?.data ?? [];
  const unreadCount = feed?.unreadCount ?? 0;
  const totalCount = feed?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pageRange = useMemo(() => {
    if (totalCount === 0) {
      return { start: 0, end: 0 };
    }
    return {
      start: (page - 1) * pageSize + 1,
      end: Math.min(totalCount, page * pageSize),
    };
  }, [page, pageSize, totalCount]);

  useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (isAuthLoading || isUserLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-muted-foreground">
        Please sign in to view notifications.
      </div>
    );
  }

  if (expectedRole && user.role !== expectedRole) {
    return (
      <div className="text-muted-foreground">
        This section is only available to {expectedRole}s.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay on top of sales, payouts, and account updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => markAll.mutate({ userId: user.id })}
            disabled={unreadCount === 0 || markAll.isPending}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as NotificationFilter)}
          >
            <TabsList>
              {filters.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notifications found for this filter.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">
                    {notification.type}
                  </TableCell>
                  <TableCell>{notification.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {notification.message ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        notification.status === "UNREAD" ? "default" : "secondary"
                      }
                      className="capitalize"
                    >
                      {notification.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {notification.status === "UNREAD" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          markRead.mutate({
                            notificationId: notification.id,
                            userId: user.id,
                          })
                        }
                      >
                        Mark read
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {pageRange.start}-{pageRange.end} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
