"use client";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotificationPreferencesCard } from "@/components/shared/notification-preferences-card";
import { CheckCircle, CreditCard, ExternalLink, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileSettings } from "@/components/profile-settings";
import { VisibilitySettings } from "@/components/shared/visibility-settings";

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

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={currentUser.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={currentUser.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge className="capitalize">{currentUser.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public Profile */}
      <ProfileSettings user={currentUser} />

      {/* Stripe Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stripe Connection</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive commission payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onboardingError ? (
            <p className="text-sm text-destructive">{onboardingError}</p>
          ) : null}
          {manageError ? (
            <p className="text-sm text-destructive">{manageError}</p>
          ) : null}
          {currentUser.stripeConnectedAccountId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Stripe Connected</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageStripe}
                  disabled={isManaging}
                >
                  Manage
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
              {currentUser.onboardingStatus ? (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {currentUser.onboardingStatus}
                  </Badge>
                  {currentUser.onboardingStatus === "complete" ? (
                    <span className="text-muted-foreground">
                      Account is fully verified.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Additional verification may be required.
                    </span>
                  )}
                </div>
              ) : null}
              {currentUser.onboardingStatus === "pending" &&
              currentUser.onboardingData?.requirements ? (
                <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleContinueOnboarding}
                      disabled={isContinuingOnboarding}
                    >
                      {isContinuingOnboarding ? "Opening..." : "Continue onboarding"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshStatus}
                      disabled={isRefreshingStatus}
                    >
                      {isRefreshingStatus ? "Refreshing..." : "Refresh status"}
                    </Button>
                  </div>
                  {currentUser.onboardingData.requirements.disabled_reason ? (
                    <div>
                      <p className="font-medium">Disabled reason</p>
                      <p className="text-muted-foreground">
                        {currentUser.onboardingData.requirements.disabled_reason}
                      </p>
                    </div>
                  ) : null}
                  {currentUser.onboardingData.requirements.currently_due?.length ? (
                    <div>
                      <p className="font-medium">Currently due</p>
                      <p className="text-muted-foreground">
                        {currentUser.onboardingData.requirements.currently_due.join(
                          ", ",
                        )}
                      </p>
                    </div>
                  ) : null}
                  {currentUser.onboardingData.requirements.past_due?.length ? (
                    <div>
                      <p className="font-medium">Past due</p>
                      <p className="text-muted-foreground">
                        {currentUser.onboardingData.requirements.past_due.join(
                          ", ",
                        )}
                      </p>
                    </div>
                  ) : null}
                  {currentUser.onboardingData.requirements.errors?.length ? (
                    <div className="space-y-2">
                      <p className="font-medium">Errors</p>
                      {currentUser.onboardingData.requirements.errors.map(
                        (error, index) => (
                          <div key={`${error.code ?? "error"}-${index}`}>
                            <p className="text-muted-foreground">
                              {error.reason ?? "Additional information required."}
                            </p>
                            {error.requirement ? (
                              <p className="text-xs text-muted-foreground">
                                Requirement: {error.requirement}
                              </p>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your Stripe account to start receiving affiliate
                payments and manage payouts.
              </p>
              {connectError ? (
                <p className="text-sm text-destructive">{connectError}</p>
              ) : null}
              <Button onClick={handleConnectStripe} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Stripe Account"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Method</CardTitle>
          <CardDescription>
            Configure how you receive your earnings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Bank Account</p>
                <p className="text-sm text-muted-foreground">
                  **** **** **** 4242
                </p>
              </div>
            </div>
            <Badge variant="outline">Default</Badge>
          </div>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Payout Method
          </Button>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Information</CardTitle>
          <CardDescription>
            Required for payouts above $600/year.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">W-9 Form</p>
              <p className="text-sm text-muted-foreground">
                Required for US-based affiliates
              </p>
            </div>
            <Badge variant="outline">Not Submitted</Badge>
          </div>
          <Button variant="outline">Submit W-9</Button>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <VisibilitySettings
        initialVisibility={currentUser.visibility || "PUBLIC"}
        onSave={handleVisibilitySave}
        type="user"
      />

      <NotificationPreferencesCard userId={currentUser.id} />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This action cannot be undone. All your data and pending earnings
            will be forfeited.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
