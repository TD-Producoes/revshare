"use client";

import { CheckCircle, CreditCard, ExternalLink, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OnboardingRequirement = {
  code?: string | null;
  reason?: string | null;
  requirement?: string | null;
};

type PayoutsTabProps = {
  stripeConnectedAccountId: string | null;
  onboardingStatus?: string | null;
  onboardingData?: {
    requirements?: {
      disabled_reason?: string | null;
      currently_due?: string[] | null;
      past_due?: string[] | null;
      errors?: OnboardingRequirement[] | null;
    };
  } | null;
  onboardingError: string | null;
  manageError: string | null;
  connectError: string | null;
  isConnecting: boolean;
  isManaging: boolean;
  isRefreshingStatus: boolean;
  isContinuingOnboarding: boolean;
  onConnectStripe: () => void;
  onManageStripe: () => void;
  onContinueOnboarding: () => void;
  onRefreshStatus: () => void;
};

export function MarketerPayoutsTab({
  stripeConnectedAccountId,
  onboardingStatus,
  onboardingData,
  onboardingError,
  manageError,
  connectError,
  isConnecting,
  isManaging,
  isRefreshingStatus,
  isContinuingOnboarding,
  onConnectStripe,
  onManageStripe,
  onContinueOnboarding,
  onRefreshStatus,
}: PayoutsTabProps) {
  return (
    <div className="space-y-6">
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
          {stripeConnectedAccountId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Stripe Connected</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onManageStripe}
                  disabled={isManaging}
                >
                  Manage
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
              {onboardingStatus ? (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {onboardingStatus}
                  </Badge>
                  {onboardingStatus === "complete" ? (
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
              {onboardingStatus === "pending" && onboardingData?.requirements ? (
                <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onContinueOnboarding}
                      disabled={isContinuingOnboarding}
                    >
                      {isContinuingOnboarding
                        ? "Opening..."
                        : "Continue onboarding"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onRefreshStatus}
                      disabled={isRefreshingStatus}
                    >
                      {isRefreshingStatus ? "Refreshing..." : "Refresh status"}
                    </Button>
                  </div>
                  {onboardingData.requirements.disabled_reason ? (
                    <div>
                      <p className="font-medium">Disabled reason</p>
                      <p className="text-muted-foreground">
                        {onboardingData.requirements.disabled_reason}
                      </p>
                    </div>
                  ) : null}
                  {onboardingData.requirements.currently_due?.length ? (
                    <div>
                      <p className="font-medium">Currently due</p>
                      <p className="text-muted-foreground">
                        {onboardingData.requirements.currently_due.join(", ")}
                      </p>
                    </div>
                  ) : null}
                  {onboardingData.requirements.past_due?.length ? (
                    <div>
                      <p className="font-medium">Past due</p>
                      <p className="text-muted-foreground">
                        {onboardingData.requirements.past_due.join(", ")}
                      </p>
                    </div>
                  ) : null}
                  {onboardingData.requirements.errors?.length ? (
                    <div className="space-y-2">
                      <p className="font-medium">Errors</p>
                      {onboardingData.requirements.errors.map((error, index) => (
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
                      ))}
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
              <Button onClick={onConnectStripe} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Stripe Account"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
