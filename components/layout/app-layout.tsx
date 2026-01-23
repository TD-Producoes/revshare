"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useSidebarStore } from "@/lib/data/sidebar-store";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { SetupGuideProvider } from "@/components/creator/setup-guide-context";
import { SetupGuideWidget } from "@/components/creator/setup-guide-widget";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();
  const pathname = usePathname();
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);

  useEffect(() => {
    if (currentUser) {
      const isOnCreatorRoute = pathname.startsWith("/founder");
      const isOnMarketerRoute = pathname.startsWith("/marketer");

      // if (currentUser.role === "founder" && isOnMarketerRoute) {
      //   router.push("/founder");
      // } else if (currentUser.role === "marketer" && isOnCreatorRoute) {
      //   router.push("/marketer");
      // } else if (pathname === "/") {
      //   router.push(`/${currentUser.role}`);
      // }
    }
  }, [currentUser, pathname, router]);

  if (isAuthLoading || isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Unable to load your account.</p>
      </div>
    );
  }

  return (
    <SetupGuideProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        <main
          className={cn(
            "pt-3 transition-all duration-200",
            isCollapsed ? "pl-12" : "pl-48"
          )}
        >
          <div className="mx-auto max-w-6xl p-4 lg:p-6">{children}</div>
        </main>
        <SetupGuideWidget />
      </div>
    </SetupGuideProvider>
  );
}
