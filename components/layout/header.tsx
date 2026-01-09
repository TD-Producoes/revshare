"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/lib/hooks/notifications";
import { ChevronDown, Zap, Sun, Moon, Bell, Settings, PieChart } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { data: authUserId } = useAuthUserId();
  const { data: user } = useUser(authUserId);
  const { theme, setTheme } = useTheme();
  const [logoutError, setLogoutError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { data: notificationsPayload } = useNotifications(user?.id, 10);
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();

  const displayName = useMemo(() => user?.name ?? "User", [user?.name]);
  const notifications = notificationsPayload?.data ?? [];
  const unreadCount = notificationsPayload?.unreadCount ?? 0;
  const notificationsPath =
    user?.role === "creator" ? "/creator/notifications" : "/marketer/notifications";
  const settingsPath =
    user?.role === "creator" ? "/creator/settings" : "/marketer/settings";

  if (!authUserId || !user) return null;

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center px-4">
        <div className="flex items-center gap-2 font-semibold">
          <PieChart className="h-3.5 w-3.5" />
          <span className="text-base">RevShare</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push(settingsPath)}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
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
              <div className="px-2 py-1.5 text-muted-foreground">
                <div className="truncate">{user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 py-1">
                Role
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 text-muted-foreground capitalize">
                {user.role}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(notificationsPath)}>
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(settingsPath)}>
                Settings
              </DropdownMenuItem>
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
  );
}
