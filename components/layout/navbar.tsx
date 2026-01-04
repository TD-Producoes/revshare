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
import { Menu, ChartPie, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";

export function Navbar({
  isTransparent = false,
  forceTransparent = false
}: {
  isTransparent?: boolean,
  forceTransparent?: boolean
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
      "fixed top-0 z-50 w-full transition-all duration-300",
      isTransparentActive
        ? "border-b-transparent bg-transparent"
        : "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className={cn(
            "flex items-center gap-2 font-bold text-xl transition-colors",
            isTransparentActive ? "text-white" : "text-foreground"
          )}>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              isTransparentActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
            )}>
              <ChartPie strokeWidth={3} className="h-4 w-4" />
            </div>
            <span>RevShare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={isTransparentActive ? "text-white/80 hover:text-white bg-transparent hover:bg-white/10" : ""}>
                    Product
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            href="/"
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          >
                            <Sparkles className="h-6 w-6 text-primary" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              RevShare Market
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              The #1 marketplace for creators and marketers to
                              collaborate.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/projects" title="Projects Directory">
                        Browse all available projects and find partnerships.
                      </ListItem>
                      <ListItem href="/marketers" title="Marketers Directory">
                        Discover talented marketers to promote your products.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={isTransparentActive ? "text-white/80 hover:text-white bg-transparent hover:bg-white/10" : ""}>
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    isTransparentActive && "text-white/80 hover:text-white bg-transparent hover:bg-white/10"
                  )}>
                    <Link href="/projects">
                      Projects
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    isTransparentActive && "text-white/80 hover:text-white bg-transparent hover:bg-white/10"
                  )}>
                    <Link href="/marketers">
                      Marketers
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
                "hidden md:flex",
                isTransparentActive && "bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg shadow-orange-500/20"
              )}
              asChild
            >
              <Link href={isAuthed ? dashboardHref : "/signup"}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {dashboardLabel}
              </Link>
            </Button>
          </div>

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
    href: "/product/for-marketers",
    description: "Discover how you can earn with high-quality revenue-share programs.",
  },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
