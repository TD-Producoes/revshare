"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  ChartPie,
  Workflow,
  Network,
  BarChart3,
  ShieldCheck,
  Trophy,
  Store,
  Users,
  TrendingUp
} from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";

export function Navbar({
  isTransparent = false,
  forceTransparent = false,
  isDashboardHidden = false,
  theme = 'default'
}: {
  isTransparent?: boolean;
  forceTransparent?: boolean;
  isDashboardHidden?: boolean;
  theme?: 'default' | 'founders' | 'how-it-works' | 'trust' | 'rewards' | 'integrations' | 'marketplace';
}) {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    if (!isTransparent) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransparent]);

  const isAuthed = Boolean(currentUser);
  const isLoadingUser = isAuthLoading || isUserLoading;
  const dashboardHref =
    currentUser?.role === "marketer" ? "/marketer" : "/creator";
  const dashboardLabel = isAuthed ? "Dashboard" : "Signup";

  const isTransparentActive = (isTransparent && !isScrolled) || forceTransparent;

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-500",
      isTransparentActive
        ? "border-b-transparent bg-transparent mt-10"
        : "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-0"
    )}>
      <div className={cn(
        "mx-auto flex h-14 items-center justify-between px-4 lg:px-6 transition-all duration-500",
        isTransparentActive ? "max-w-6xl" : "max-w-7xl"
      )}>
        <div className="flex items-center gap-6">
          <Link href="/" className={cn(
            "flex items-center gap-2 font-bold text-xl transition-colors",
            isTransparentActive ? "text-white" : "text-foreground"
          )}>
            <ChartPie strokeWidth={3} className="h-4 w-4" />
            <span>RevShare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "!bg-transparent transition-all duration-300 rounded-2xl",
                    isTransparentActive
                      ? "text-white/80 hover:text-white hover:!bg-white/10 data-[state=open]:!bg-white/10 data-[state=open]:text-white"
                      : "text-foreground/70 hover:text-foreground hover:!bg-amber-50/80 data-[state=open]:!bg-amber-50/80 data-[state=open]:text-foreground"
                  )}>
                    Product
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-6 md:w-[600px] lg:w-[900px] lg:grid-cols-[1fr_1fr]">

                      <ListItem
                        href="/product/how-it-works"
                        title="How RevShare Works"
                        icon={<Workflow className="h-5 w-5 text-amber-600" />}
                      >
                        A transparent lifecycle: tracking → refunds → payouts → rewards.
                      </ListItem>
                      <ListItem
                        href="/product/revshare-vs-affiliate-networks"
                        title="RevShare vs Affiliate Networks"
                        icon={<Network className="text-amber-600 h-5 w-5" />}
                      >
                        Why traditional legacy affiliate networks are failing modern SaaS.
                      </ListItem>
                      <ListItem
                        href="/product/revshare-vs-affiliate-marketing"
                        title="RevShare vs Affiliate Marketing"
                        icon={<BarChart3 className="text-amber-600 h-5 w-5" />}
                      >
                        Recurring value vs limited one-time affiliate bounties.
                      </ListItem>
                      <ListItem
                        href="/product/trust"
                        title="Trust & Security"
                        icon={<ShieldCheck className="text-amber-600 h-5 w-5" />}
                      >
                        Refund windows, Stripe-native settlements, and immutable logs.
                      </ListItem>
                      <ListItem
                        href="/product/rewards"
                        title="Rewards & Milestones"
                        icon={<Trophy className="text-amber-600 h-5 w-5" />}
                      >
                        Automated incentives that go far beyond flat commissions.
                      </ListItem>
                      <ListItem
                        href="/product/marketplace"
                        title="Public Marketplace"
                        icon={<Store className="text-amber-600 h-5 w-5" />}
                      >
                        The open directory for discovering projects and verified marketers.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "!bg-transparent transition-all duration-300 rounded-2xl",
                    isTransparentActive
                      ? "text-white/80 hover:text-white hover:!bg-white/10 data-[state=open]:!bg-white/10 data-[state=open]:text-white"
                      : "text-foreground/70 hover:text-foreground hover:!bg-amber-50/80 data-[state=open]:!bg-amber-50/80 data-[state=open]:text-foreground"
                  )}>
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-1 lg:w-[450px]">
                      <ListItem
                        href="/solutions/for-founders"
                        title="For Founders"
                        icon={<Users className="text-amber-600 h-5 w-5" />}
                      >
                        Launch a commission-only sales force and scale your revenue without the CAC risk.
                      </ListItem>
                      <ListItem
                        href="/solutions/for-marketers"
                        title="For Marketers"
                        icon={<TrendingUp className="text-amber-600 h-5 w-5" />}
                      >
                        Partner with high-growth SaaS founders and build a sustainable recurring income stream.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    "!bg-transparent transition-all duration-300 rounded-2xl",
                    isTransparentActive
                      ? "text-white/80 hover:text-white hover:!bg-white/10"
                      : "text-foreground/70 hover:text-foreground hover:!bg-amber-50/80"
                  )}>
                    <Link href="/projects">
                      Projects
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    "!bg-transparent transition-all duration-300 rounded-2xl",
                    isTransparentActive
                      ? "text-white hover:text-white hover:!bg-white/10"
                      : "text-foreground/70 hover:text-foreground hover:!bg-amber-50/80"
                  )}>
                    <Link href="/marketers">
                      Marketers
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    "!bg-transparent transition-all duration-300 rounded-2xl",
                    isTransparentActive
                      ? "text-white/80 hover:text-white hover:!bg-white/10"
                      : "text-foreground/70 hover:text-foreground hover:!bg-amber-50/80"
                  )}>
                    <Link href="/pricing">
                      Pricing
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isDashboardHidden && (
            <div className="flex items-center gap-2">
              {!isAuthed && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "hidden md:flex",
                    isTransparentActive && "text-white hover:text-white hover:bg-white/10"
                  )}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
              <Button
                size="sm"
                className={cn(
                  "hidden md:flex transition-all duration-300",
                  isTransparentActive
                    ? theme === 'founders'
                      ? "bg-[#BFF2A0] hover:bg-[#AEE190] text-[#0B1710] font-bold rounded-full border-none shadow-none px-4 h-8"
                      : theme === 'how-it-works'
                        ? "bg-[#818CF8] hover:bg-[#717CF8] text-white font-bold rounded-full border-none shadow-none px-4 h-8"
                        : theme === 'trust'
                          ? "bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-full border-none shadow-none px-4 h-8"
                          : theme === 'rewards'
                            ? "bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-full border-none shadow-none px-4 h-8"
                            : theme === 'integrations'
                              ? "bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold rounded-full border-none shadow-none px-4 h-8"
                              : theme === 'marketplace'
                                ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-full border-none shadow-none px-4 h-8"
                                : "bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] text-white font-bold rounded-full border-none shadow-none px-4 h-8"
                    : "bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full border-none shadow-lg px-3 shadow-amber-500/10"
                )}
                asChild
              >
                <Link href={isAuthed ? dashboardHref : "/signup"}>
                  {dashboardLabel}
                </Link>
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "lg:hidden",
                  isTransparentActive && "text-white border-white/20 bg-white/10"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-6">
                <Link href="/projects" className="text-sm font-medium">
                  Projects
                </Link>
                <Link href="/marketers" className="text-sm font-medium">
                  Marketers
                </Link>
                <Link href="/pricing" className="text-sm font-medium">
                  Pricing
                </Link>
                <div className="my-2 h-px bg-border" />
                {!isAuthed && !isLoadingUser ? (
                  <Link href="/login" className="text-sm font-medium">
                    Sign In
                  </Link>
                ) : null}
                <Link
                  href={isAuthed ? dashboardHref : "/signup"}
                  className="text-sm font-medium text-primary"
                >
                  {dashboardLabel}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Projects",
    href: "/projects",
    description: "Browse all available projects and find partnerships.",
  },
  {
    title: "Marketers",
    href: "/marketers",
    description: "Discover talented marketers to promote your products.",
  },
  {
    title: "For Marketers",
    href: "/solutions/for-marketers",
    description: "Discover how you can earn with high-quality revenue-share programs.",
  },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "flex items-start gap-4 select-none rounded-[1.25rem] p-5 leading-none no-underline outline-none transition-all hover:bg-slate-50 group",
            className
          )}
          {...props}
        >
          {icon}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <div className="text-xs font-bold leading-none tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors antialiased">
              {title}
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium group-hover:text-slate-600 transition-colors">
              {children}
            </p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
