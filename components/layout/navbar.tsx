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
import { Menu, Sparkles, Github, LayoutDashboard } from "lucide-react";

export function Navbar() {
    return (
        <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span>RevShare</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex">
                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                            <li className="row-span-3">
                                                <NavigationMenuLink asChild>
                                                    <a
                                                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                                        href="/"
                                                    >
                                                        <Sparkles className="h-6 w-6 text-primary" />
                                                        <div className="mb-2 mt-4 text-lg font-medium">
                                                            RevShare Market
                                                        </div>
                                                        <p className="text-sm leading-tight text-muted-foreground">
                                                            The #1 marketplace for creators and marketers to
                                                            collaborate.
                                                        </p>
                                                    </a>
                                                </NavigationMenuLink>
                                            </li>
                                            <ListItem href="/creators" title="For Creators">
                                                Find marketers to promote your products.
                                            </ListItem>
                                            <ListItem href="/marketers" title="For Marketers">
                                                Discover high-converting products to sell.
                                            </ListItem>
                                            <ListItem href="/enterprise" title="Enterprise">
                                                Custom contracts and volume pricing.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
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
                                    <Link href="/pricing" legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Pricing
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href="/docs" legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Docs
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Link
                            href="https://github.com"
                            target="_blank"
                            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Github className="h-4 w-4" />
                            <span className="hidden xl:inline">Star on GitHub</span>
                            <span className="hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums group-hover:text-foreground xl:flex">
                                9.2k
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button size="sm" className="hidden md:flex" asChild>
                            <Link href="/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-4 py-6">
                                <Link href="/product" className="text-sm font-medium">
                                    Product
                                </Link>
                                <Link href="/solutions" className="text-sm font-medium">
                                    Solutions
                                </Link>
                                <Link href="/pricing" className="text-sm font-medium">
                                    Pricing
                                </Link>
                                <Link href="/docs" className="text-sm font-medium">
                                    Docs
                                </Link>
                                <div className="my-2 h-px bg-border" />
                                <Link href="/login" className="text-sm font-medium">
                                    Sign In
                                </Link>
                                <Link href="/dashboard" className="text-sm font-medium text-primary">
                                    Dashboard
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
        title: "Analytics",
        href: "/solutions/analytics",
        description: "Deep insights into your revenue streams and affiliate performance.",
    },
    {
        title: "Automations",
        href: "/solutions/automations",
        description: "Trigger payouts and emails based on custom events.",
    },
    {
        title: "Stripe Connect",
        href: "/solutions/stripe",
        description: "Seamless global payouts handled automatically.",
    },
    {
        title: "Audit Logs",
        href: "/solutions/audit",
        description: "Track every commission and click with enterprise-grade logging.",
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
