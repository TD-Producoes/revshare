"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useCreatorDashboard } from "@/lib/hooks/creator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useSetupGuide } from "@/components/creator/setup-guide-context";

export function SetupGuideWidget() {
  const { data: authUserId } = useAuthUserId();
  const { data: currentUser } = useUser(authUserId);
  const { data: creatorDashboard } = useCreatorDashboard(
    currentUser?.id,
  );
  const { isDismissed, isCollapsed, closeGuide, toggleCollapsed } =
    useSetupGuide();
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== "founder" || isDismissed) {
    return null;
  }

  const isStripeConnected = Boolean(currentUser.stripeConnectedAccountId);
  const steps = [
    {
      id: "stripe",
      title: "Connect Stripe",
      description: "Enable payouts and charge collection.",
      isComplete: isStripeConnected,
    },
    {
      id: "coupon",
      title: "Create a coupon",
      description: "Offer exclusive discounts to marketers.",
      isComplete: false,
    },
    {
      id: "reward",
      title: "Create a reward",
      description: "Incentivize top performers with bonuses.",
      isComplete: false,
    },
  ];
  const handleConnectStripe = async () => {
    if (!currentUser) return;
    setSetupError(null);
    setIsConnectingStripe(true);
    try {
      const origin = window.location.origin;
      const response = await fetch("/api/connect/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email ?? "",
          name: currentUser.name ?? "",
          role: "founder",
          returnUrl: `${origin}/founder`,
          refreshUrl: `${origin}/founder`,
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
      throw new Error("Missing Stripe onboarding URL.");
    } catch (error) {
      setSetupError(
        error instanceof Error ? error.message : "Failed to connect Stripe."
      );
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const firstProjectId = creatorDashboard?.projects?.[0]?.id ?? null;
  const couponDisabled = !isStripeConnected || !firstProjectId;
  const rewardDisabled = !firstProjectId;
  const couponHref = firstProjectId
    ? `/founder/projects/${firstProjectId}?tab=coupons&create=coupon`
    : "#";
  const rewardHref = firstProjectId
    ? `/founder/projects/${firstProjectId}?tab=rewards&create=reward`
    : "#";
  const completedSteps = steps.filter((step) => step.isComplete).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.isComplete) ?? steps[0];
  const nextHref =
    nextStep.id === "coupon"
      ? couponHref
      : nextStep.id === "reward"
        ? rewardHref
        : "#";
  const nextDisabled =
    (nextStep.id === "coupon" && couponDisabled) ||
    (nextStep.id === "reward" && rewardDisabled) ||
    (nextStep.id === "stripe" && isStripeConnected);

  return (
    <Card className="fixed bottom-6 right-6 w-[330px] max-w-[calc(100vw-3rem)] shadow-lg z-40 gap-0">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Setup guide</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand setup guide" : "Collapse setup guide"}
            >
              {isCollapsed ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={closeGuide}
              aria-label="Close setup guide"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{completedSteps}/{steps.length} complete</span>
          {nextDisabled ? (
            <span>Next: {nextStep.title}</span>
          ) : (
            <Link
              href={nextHref}
              className="hover:underline"
            >
              Next: {nextStep.title}
            </Link>
          )}
        </div>
      </CardHeader>
      <Collapsible open={!isCollapsed}>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p
                  className={
                    isStripeConnected
                      ? "text-sm font-semibold line-through text-muted-foreground"
                      : "text-sm font-semibold"
                  }
                >
                  Connect Stripe
                </p>
                <p className="text-xs text-muted-foreground">
                  Enable payouts and charge collection.
                </p>
              </div>
              {isStripeConnected ? (
                <Badge variant="secondary">Connected</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                >
                  {isConnectingStripe ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>

            <Separator />

            <Link
              href={couponHref}
              aria-disabled={couponDisabled}
              onClick={(event) => {
                if (couponDisabled) {
                  event.preventDefault();
                }
              }}
              className={
                couponDisabled
                  ? "flex items-center justify-between gap-3 rounded-md px-1 py-1 text-muted-foreground cursor-not-allowed"
                  : "flex items-center justify-between gap-3 rounded-md px-1 py-1 hover:bg-muted/40 transition-colors"
              }
            >
              <div className="space-y-1">
                <p
                  className={
                    couponDisabled
                      ? "text-sm font-semibold text-muted-foreground"
                      : "text-sm font-semibold"
                  }
                >
                  Create a coupon
                </p>
                <p className="text-xs text-muted-foreground">
                  Offer exclusive discounts to marketers.
                </p>
                {couponDisabled && (
                  <p className="text-[11px] text-muted-foreground">
                    {firstProjectId
                      ? "Requires Stripe connection."
                      : "Create a project first."}
                  </p>
                )}
              </div>
              <Badge variant="secondary">Locked</Badge>
            </Link>

            <Separator />

            <Link
              href={rewardHref}
              aria-disabled={rewardDisabled}
              onClick={(event) => {
                if (rewardDisabled) {
                  event.preventDefault();
                }
              }}
              className={
                rewardDisabled
                  ? "flex items-center justify-between gap-3 rounded-md px-1 py-1 text-muted-foreground cursor-not-allowed"
                  : "flex items-center justify-between gap-3 rounded-md px-1 py-1 hover:bg-muted/40 transition-colors"
              }
            >
              <div className="space-y-1">
                <p
                  className={
                    rewardDisabled
                      ? "text-sm font-semibold text-muted-foreground"
                      : "text-sm font-semibold"
                  }
                >
                  Create a reward
                </p>
                <p className="text-xs text-muted-foreground">
                  Incentivize top performers with bonuses.
                </p>
                {rewardDisabled && (
                  <p className="text-[11px] text-muted-foreground">
                    Create a project first.
                  </p>
                )}
              </div>
              <Badge variant="secondary">
                {rewardDisabled ? "Locked" : "Create"}
              </Badge>
            </Link>

            {setupError && (
              <p className="text-sm text-destructive">{setupError}</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
