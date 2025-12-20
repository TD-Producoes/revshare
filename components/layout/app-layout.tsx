"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useCurrentUser } from "@/lib/data/store";
import { useSidebarStore } from "@/lib/data/sidebar-store";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const currentUser = useCurrentUser();
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (currentUser) {
      const isOnCreatorRoute = pathname.startsWith("/creator");
      const isOnMarketerRoute = pathname.startsWith("/marketer");

      if (currentUser.role === "creator" && isOnMarketerRoute) {
        router.push("/creator");
      } else if (currentUser.role === "marketer" && isOnCreatorRoute) {
        router.push("/marketer");
      } else if (pathname === "/") {
        router.push(`/${currentUser.role}`);
      }
    }
  }, [currentUser, pathname, router]);

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main
        className={cn(
          "pt-12 transition-all duration-200",
          isCollapsed ? "pl-12" : "pl-48"
        )}
      >
        <div className="mx-auto max-w-6xl p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
