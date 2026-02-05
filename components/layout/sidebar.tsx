"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useSidebarStore } from "@/lib/data/sidebar-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Search,
  CreditCard,
  Wallet,
  Bell,
  History,
  TrendingUp,
  Bot,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useNotifications } from "@/lib/hooks/notifications";
import { useContractsForCreator } from "@/lib/hooks/contracts";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

type NavSection = {
  label?: string;
  items: NavItem[];
};

const creatorNavSections: NavSection[] = [
  {
    items: [{ title: "Dashboard", href: "/founder", icon: LayoutDashboard }],
  },
  {
    label: "Discover",
    items: [
      { title: "Marketers", href: "/founder/discover-marketers", icon: Search },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Projects", href: "/founder/projects", icon: FolderKanban },
      { title: "Affiliates", href: "/founder/affiliates", icon: Users },
      { title: "Applications", href: "/founder/applications", icon: FileText },
      { title: "Bots", href: "/founder/bots", icon: Bot },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payouts", href: "/founder/payouts", icon: CreditCard },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Notifications", href: "/founder/notifications", icon: Bell },
      { title: "Audit Log", href: "/founder/events", icon: History },
    ],
  },
];

const marketerNavSections: NavSection[] = [
  {
    items: [{ title: "Dashboard", href: "/marketer", icon: LayoutDashboard }],
  },
  {
    label: "Discover",
    items: [
      { title: "Projects", href: "/marketer/projects", icon: Search },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Applications", href: "/marketer/applications", icon: FileText },
      { title: "Invitations", href: "/marketer/invitations", icon: Users },
      { title: "Bots", href: "/marketer/bots", icon: Bot },
    ],
  },
  {
    label: "Insights",
    items: [{ title: "Metrics", href: "/marketer/metrics", icon: TrendingUp }],
  },
  {
    label: "Finance",
    items: [
      { title: "Earnings", href: "/marketer/earnings", icon: Wallet },
      { title: "Payouts", href: "/marketer/payouts", icon: CreditCard },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Notifications", href: "/marketer/notifications", icon: Bell },
      { title: "Audit Log", href: "/marketer/events", icon: History },
    ],
  },
];

function NavLink({
  item,
  isActive,
  isCollapsed,
  signalCount,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  signalCount?: number;
}) {
  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-2 py-2 text-xs transition-colors",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-secondary text-secondary-foreground font-medium"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-foreground")} />
      {!isCollapsed && <span>{item.title}</span>}
      {signalCount && signalCount > 0 ? (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-red-500 text-white font-bold",
            isCollapsed
              ? "absolute right-2 top-2 h-2 w-2"
              : "ml-auto h-4 min-w-[1rem] px-1 text-[10px]"
          )}
        >
          {!isCollapsed && (signalCount > 99 ? "99+" : signalCount)}
        </span>
      ) : null}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function Sidebar() {
  const { data: authUserId } = useAuthUserId();
  const { data: user } = useUser(authUserId);
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();

  // Fetch signals (must not be conditional)
  const { data: notifications } = useNotifications(authUserId);
  const { data: contracts } = useContractsForCreator(authUserId);

  const unreadNotificationsCount = notifications?.unreadCount ?? 0;
  const pendingApplicationsCount =
    contracts?.filter((c) => c.status === "pending").length ?? 0;

  if (!user) return null;

  const isCreator = user.role === "founder";

  const isActiveLink = (href: string) =>
    pathname === href ||
    (href !== "/founder" && href !== "/marketer" && pathname.startsWith(href));

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-12 z-30 flex h-[calc(100vh-3rem)] flex-col border-r bg-background transition-all duration-200",
          isCollapsed ? "w-12" : "w-48"
        )}
      >
        <nav className="flex flex-1 flex-col gap-2 p-2">
          {(isCreator ? creatorNavSections : marketerNavSections).map(
            (section, sectionIndex) => (
              <div key={section.label ?? sectionIndex} className="space-y-1">
                {section.label && !isCollapsed ? (
                  <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {section.label}
                  </p>
                ) : null}
                {section.items.map((item) => {
                  let signalCount = 0;
                  if (item.title === "Notifications") {
                    signalCount = unreadNotificationsCount;
                  } else if (item.title === "Applications" && isCreator) {
                    signalCount = pendingApplicationsCount;
                  }
                  return (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={isActiveLink(item.href)}
                      isCollapsed={isCollapsed}
                      signalCount={signalCount}
                    />
                  );
                })}
              </div>
            ),
          )}
        </nav>

        <div className="border-t border-border p-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className={cn(
                  "mt-1 h-8 w-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  isCollapsed ? "justify-center px-2" : "justify-start px-3"
                )}
              >
                {isCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="ml-3 text-xs">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={8}>
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
