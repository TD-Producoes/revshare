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
  Bell,
  History,
  TrendingUp,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

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
    items: [{ title: "Dashboard", href: "/creator", icon: LayoutDashboard }],
  },
  {
    label: "Discover",
    items: [
      { title: "Marketers", href: "/creator/discover-marketers", icon: Search },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Projects", href: "/creator/projects", icon: FolderKanban },
      { title: "Affiliates", href: "/creator/affiliates", icon: Users },
      { title: "Applications", href: "/creator/applications", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payouts", href: "/creator/payouts", icon: CreditCard },
      { title: "Audit Log", href: "/creator/events", icon: History },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Notifications", href: "/creator/notifications", icon: Bell },
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
    ],
  },
  {
    label: "Insights",
    items: [{ title: "Metrics", href: "/marketer/metrics", icon: TrendingUp }],
  },
  {
    label: "Finance",
    items: [
      { title: "Earnings", href: "/marketer/earnings", icon: CreditCard },
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
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-secondary text-secondary-foreground font-medium"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-foreground")} />
      {!isCollapsed && <span>{item.title}</span>}
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

  if (!user) return null;

  const isCreator = user.role === "creator";

  const isActiveLink = (href: string) =>
    pathname === href ||
    (href !== "/creator" && href !== "/marketer" && pathname.startsWith(href));

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
                  <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {section.label}
                  </p>
                ) : null}
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={isActiveLink(item.href)}
                    isCollapsed={isCollapsed}
                  />
                ))}
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
                    <span className="ml-3 text-sm">Collapse</span>
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
