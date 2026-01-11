"use client";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketerAccountTab } from "@/components/marketer/settings-tabs/account-tab";
import { MarketerPayoutsTab } from "@/components/marketer/settings-tabs/payouts-tab";
import { MarketerNotificationsTab } from "@/components/marketer/settings-tabs/notifications-tab";
import { MarketerVisibilityTab } from "@/components/marketer/settings-tabs/visibility-tab";
import { MarketerDangerTab } from "@/components/marketer/settings-tabs/danger-tab";

export default function SettingsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isContinuingOnboarding, setIsContinuingOnboarding] = useState(false);
  const statusChecked = useRef(false);
  const onboardingHandled = useRef(false);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    const status = searchParams.get("onboarding");
    const accountId = searchParams.get("accountId");
    if (status !== "return" || !accountId || onboardingHandled.current) {
      return;
    }
    onboardingHandled.current = true;

    const finalize = async () => {
      setOnboardingError(null);
      try {
        const response = await fetch(
          `/api/connect/complete?accountId=${accountId}`,
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to finalize onboarding.");
        }
        await queryClient.invalidateQueries({
          queryKey: ["user", authUserId ?? "none"],
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to finalize onboarding.";
        setOnboardingError(message);
      } finally {
        router.replace("/marketer/settings");
      }
    };

    finalize();
  }, [authUserId, queryClient, router, searchParams]);

  useEffect(() => {
    if (
      !currentUser ||
      !currentUser.stripeConnectedAccountId ||
      currentUser.onboardingStatus !== "pending" ||
      statusChecked.current
    ) {
      return;
    }
    statusChecked.current = true;
    const refresh = async () => {
      setIsRefreshingStatus(true);
      setOnboardingError(null);
      try {
        const response = await fetch(
          `/api/connect/complete?accountId=${currentUser.stripeConnectedAccountId}`,
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to refresh status.");
        }
        await queryClient.invalidateQueries({
          queryKey: ["user", authUserId ?? "none"],
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to refresh status.";
        setOnboardingError(message);
      } finally {
        setIsRefreshingStatus(false);
      }
    };

    refresh();
  }, [authUserId, currentUser, queryClient]);

  if (isAuthLoading || isUserLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "marketer") {
    return (
      <div className="text-muted-foreground">
        This section is only available to marketers.
      </div>
    );
  }

  const handleConnectStripe = async () => {
    setConnectError(null);
    setIsConnecting(true);
    try {
      const origin = window.location.origin;
      const response = await fetch("/api/connect/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          role: "marketer",
          returnUrl: `${origin}/marketer/settings`,
          refreshUrl: `${origin}/marketer/settings`,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to connect Stripe.");
      }
      if (payload?.data?.onboardingUrl) {
        window.location.href = payload.data.onboardingUrl;
        return;
      }
      throw new Error("Missing onboarding URL.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect Stripe.";
      setConnectError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManageStripe = async () => {
    if (!currentUser.stripeConnectedAccountId) return;
    setManageError(null);
    setIsManaging(true);
    try {
      const response = await fetch(
        `/api/connect/login?accountId=${currentUser.stripeConnectedAccountId}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to open Stripe.");
      }
      if (payload?.data?.url) {
        window.location.href = payload.data.url;
        return;
      }
      throw new Error("Missing Stripe login URL.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to open Stripe.";
      setManageError(message);
    } finally {
      setIsManaging(false);
    }
  };

  const handleContinueOnboarding = async () => {
    if (!currentUser?.stripeConnectedAccountId) return;
    setOnboardingError(null);
    setIsContinuingOnboarding(true);
    try {
      const origin = window.location.origin;
      const refreshUrl = encodeURIComponent(`${origin}/marketer/settings`);
      const returnUrl = encodeURIComponent(`${origin}/marketer/settings`);
      const response = await fetch(
        `/api/connect/onboarding-link?accountId=${currentUser.stripeConnectedAccountId}&refreshUrl=${refreshUrl}&returnUrl=${returnUrl}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to continue onboarding.");
      }
      if (payload?.data?.url) {
        window.location.href = payload.data.url;
        return;
      }
      throw new Error("Missing onboarding URL.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to continue onboarding.";
      setOnboardingError(message);
    } finally {
      setIsContinuingOnboarding(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!currentUser?.stripeConnectedAccountId) return;
    setOnboardingError(null);
    setIsRefreshingStatus(true);
    try {
      const response = await fetch(
        `/api/connect/complete?accountId=${currentUser.stripeConnectedAccountId}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to refresh status.");
      }
      await queryClient.invalidateQueries({
        queryKey: ["user", authUserId ?? "none"],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh status.";
      setOnboardingError(message);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const handleVisibilitySave = async (data: {
    visibility: "PUBLIC" | "GHOST" | "PRIVATE";
  }) => {
    if (!currentUser) return;
    const response = await fetch(`/api/users/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: data.visibility }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Failed to update visibility");
    }
    await queryClient.invalidateQueries({
      queryKey: ["user", authUserId ?? "none"],
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and payout preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger className="px-3 py-2 text-sm" value="account">
              Account
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="payouts">
              Payouts
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="visibility">
              Visibility
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="notifications">
              Notifications
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="danger">
              Danger
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account">
          <MarketerAccountTab
            name={currentUser.name}
            email={currentUser.email}
            role={currentUser.role}
            profileUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="payouts">
          <MarketerPayoutsTab
            stripeConnectedAccountId={currentUser.stripeConnectedAccountId}
            onboardingStatus={currentUser.onboardingStatus}
            onboardingData={currentUser.onboardingData}
            onboardingError={onboardingError}
            manageError={manageError}
            connectError={connectError}
            isConnecting={isConnecting}
            isManaging={isManaging}
            isRefreshingStatus={isRefreshingStatus}
            isContinuingOnboarding={isContinuingOnboarding}
            onConnectStripe={handleConnectStripe}
            onManageStripe={handleManageStripe}
            onContinueOnboarding={handleContinueOnboarding}
            onRefreshStatus={handleRefreshStatus}
          />
        </TabsContent>

        <TabsContent value="visibility">
          <MarketerVisibilityTab
            visibility={currentUser.visibility || "PUBLIC"}
            onSave={handleVisibilitySave}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <MarketerNotificationsTab userId={currentUser.id} />
        </TabsContent>

        <TabsContent value="danger">
          <MarketerDangerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
