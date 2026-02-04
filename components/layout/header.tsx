"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useCreatorDashboard } from "@/lib/hooks/creator";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/lib/hooks/notifications";
import { toast } from "sonner";
import { CreateProjectForm } from "@/components/creator/create-project-form";
import { useSetupGuide } from "@/components/creator/setup-guide-context";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import {
  ChevronDown,
  Bell,
  Settings,
  PieChart,
  ImagePlus,
  Plus,
  TicketPercent,
  Gift,
  MessageSquareText,
} from "lucide-react";

export function Header() {
  const router = useRouter();
  const { data: authUserId } = useAuthUserId();
  const { data: user } = useUser(authUserId);
  const { theme, setTheme } = useTheme();
  const [logoutError, setLogoutError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLastSeenAt, setChatLastSeenAt] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const { data: notificationsPayload } = useNotifications(user?.id, 10);
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const isFounder = user?.role === "founder";
  const { data: creatorDashboard } = useCreatorDashboard(
    isFounder ? user?.id : undefined,
  );
  const creatorProjects = creatorDashboard?.projects ?? [];
  const { isDismissed, openGuide } = useSetupGuide();

  const displayName = useMemo(() => user?.name ?? "User", [user?.name]);
  const notifications = notificationsPayload?.data ?? [];
  const unreadCount = notificationsPayload?.unreadCount ?? 0;
  const notificationsPath =
    user?.role === "founder" ? "/founder/notifications" : "/marketer/notifications";
  const settingsPath =
    user?.role === "founder" ? "/founder/settings" : "/marketer/settings";

  const chatLastSeenStorageKey = useMemo(
    () => (user?.id ? `revshare:chat:lastSeenAt:${user.id}` : null),
    [user?.id],
  );

  useEffect(() => {
    if (!chatLastSeenStorageKey) return;
    const raw = window.localStorage.getItem(chatLastSeenStorageKey);
    const n = raw ? Number(raw) : NaN;
    const fallback = Date.now();
    const value = Number.isFinite(n) ? n : fallback;
    setChatLastSeenAt(value);

    if (!Number.isFinite(n)) {
      window.localStorage.setItem(chatLastSeenStorageKey, String(value));
    }
  }, [chatLastSeenStorageKey]);

  const viewerId = user?.id ?? "";

  const chatUnreadQuery = useQuery<{ unreadCount: number }>({
    queryKey: ["chat-unread-count", viewerId, chatLastSeenAt ?? "none"],
    enabled: Boolean(viewerId) && chatLastSeenAt !== null,
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations");
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load conversations");
      const list = Array.isArray(json?.data) ? (json.data as any[]) : [];
      const lastSeen = chatLastSeenAt ?? 0;

      // Count conversations where the last message is newer than lastSeen and is not from me.
      let count = 0;
      for (const c of list) {
        const lastMessageAt = c?.lastMessageAt
          ? new Date(c.lastMessageAt).getTime()
          : NaN;
        const last = c?.messages?.[0];
        const lastSender = last?.senderUserId as string | undefined;
        if (
          Number.isFinite(lastMessageAt) &&
          lastMessageAt > lastSeen &&
          lastSender &&
          lastSender !== viewerId
        ) {
          count += 1;
        }
      }

      return { unreadCount: count };
    },
    refetchInterval: 15000,
  });

  const chatUnreadCount = chatUnreadQuery.data?.unreadCount ?? 0;

  useEffect(() => {
    if (!chatOpen) return;
    if (!chatLastSeenStorageKey) return;
    const now = Date.now();
    window.localStorage.setItem(chatLastSeenStorageKey, String(now));
    setChatLastSeenAt(now);
  }, [chatOpen, chatLastSeenStorageKey]);

  useEffect(() => {
    let isActive = true;
    const loadAvatar = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (!isActive) return;
      if (error || !data.user) {
        setAvatarUrl(null);
        return;
      }
      const metadata = data.user.user_metadata ?? {};
      const url =
        typeof metadata.avatar_url === "string"
          ? metadata.avatar_url
          : typeof metadata.picture === "string"
            ? metadata.picture
            : null;
      setAvatarUrl(url);
    };
    void loadAvatar();

    return () => {
      isActive = false;
    };
  }, [authUserId]);

  if (!authUserId || !user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    setLogoutError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLogoutError(error.message);
      return;
    }
    router.push("/login");
    router.refresh();
  };

  const handleMarkAll = async () => {
    if (!user?.id) return;
    await markAllNotificationsRead.mutateAsync({ userId: user.id });
  };

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setFeedbackError("Please enter your feedback.");
      return;
    }
    setIsSubmittingFeedback(true);
    setFeedbackError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to send feedback.");
      }
      toast.success("Feedback sent. Thank you!");
      setFeedbackText("");
      setFeedbackOpen(false);
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : "Failed to send feedback."
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      <CreateProjectForm
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        trigger={null}
      />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-2 font-semibold">
            <PieChart className="h-4 w-4" />
            <span className="text-base">RevShare</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ChatDrawer
              open={chatOpen}
              onOpenChange={setChatOpen}
              viewerUserId={user.id}
            />
            {isFounder ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="h-4 w-4" />
                      Create
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        setIsCreateProjectOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <TicketPercent className="h-3.5 w-3.5" />
                        Create coupon
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {creatorProjects.length === 0 ? (
                          <DropdownMenuItem disabled>
                            No projects yet
                          </DropdownMenuItem>
                        ) : (
                          creatorProjects.map((project) => (
                            <DropdownMenuItem
                              key={project.id}
                              onSelect={() =>
                                router.push(
                                  `/founder/projects/${project.id}?tab=coupons&create=coupon`,
                                )
                              }
                            >
                              {project.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Gift className="h-3.5 w-3.5" />
                        Create reward
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {creatorProjects.length === 0 ? (
                          <DropdownMenuItem disabled>
                            No projects yet
                          </DropdownMenuItem>
                        ) : (
                          creatorProjects.map((project) => (
                            <DropdownMenuItem
                              key={project.id}
                              onSelect={() =>
                                router.push(
                                  `/founder/projects/${project.id}?tab=rewards&create=reward`,
                                )
                              }
                            >
                              {project.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isDismissed ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={openGuide}
                  >
                    Setup
                  </Button>
                ) : null}

              </>
            ) : null}

            <Popover open={feedbackOpen} onOpenChange={setFeedbackOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-3">
                  Feedback
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3">
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <Textarea
                      value={feedbackText}
                      onChange={(event) => setFeedbackText(event.target.value)}
                      placeholder="My idea for improving RevShare is..."
                      className="min-h-[140px] border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                    />
                  </div>
                  {feedbackError ? (
                    <p className="text-[10px] text-destructive">{feedbackError}</p>
                  ) : null}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled
                      aria-label="Attach image"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Button type="submit" size="sm" className="h-8" disabled={isSubmittingFeedback}>
                      {isSubmittingFeedback ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(settingsPath)}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => setChatOpen(true)}
              aria-label="Open chat"
            >
              <MessageSquareText className="h-4 w-4" />
              {chatUnreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground text-white">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              ) : null}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAll}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </Button>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start gap-1 py-3"
                        onClick={() => {
                          if (notification.status === "UNREAD" && user?.id) {
                            markNotificationRead.mutate({
                              notificationId: notification.id,
                              userId: user.id,
                            });
                          }
                        }}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="text-sm font-medium">
                            {notification.title}
                          </span>
                          {notification.status === "UNREAD" ? (
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        {notification.message ? (
                          <span className="text-xs text-muted-foreground">
                            {notification.message}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(notificationsPath)}>
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                  <Avatar className="h-6 w-6">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs">
                <div className="px-2 py-1.5 space-y-1 text-muted-foreground">
                  <div className="truncate">{user.email}</div>
                  <div className="truncate">{user.role}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(notificationsPath)}>
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(settingsPath)}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 py-1">
                  Theme
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={theme ?? "system"}
                  onValueChange={(value) => {
                    if (value === "dark" || value === "light" || value === "system") {
                      setTheme(value);
                    }
                  }}
                >
                  <DropdownMenuRadioItem value="dark">
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {logoutError && (
          <div className="px-4 pb-2 text-xs text-destructive">{logoutError}</div>
        )}
      </header>
    </>
  );
}
