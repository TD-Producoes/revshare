"use client";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, CreditCard, ExternalLink, Plus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import {
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "@/lib/hooks/payment-methods";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUBLISHABLE_KEY ?? "";

export default function SettingsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: paymentMethods = [], isLoading: isPaymentMethodsLoading } =
    usePaymentMethods(authUserId);
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod(authUserId);
  const queryClient = useQueryClient();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [isOpeningPaymentDialog, setIsOpeningPaymentDialog] = useState(false);
  const [isUpdatingAutoCharge, setIsUpdatingAutoCharge] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(
    null,
  );
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [stripeElements, setStripeElements] = useState<StripeElements | null>(
    null,
  );
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const paymentElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!paymentDialogOpen) {
      setPaymentClientSecret(null);
      setPaymentSetupError(null);
      return;
    }
    if (!currentUser?.id) {
      return;
    }

    const prepare = async () => {
      setPaymentSetupError(null);
      setIsPreparingPayment(true);
      try {
        const response = await fetch("/api/creator/payment-methods/setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to start payment setup.");
        }
        setPaymentClientSecret(payload?.data?.clientSecret ?? null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to start payment setup.";
        setPaymentSetupError(message);
      } finally {
        setIsPreparingPayment(false);
      }
    };

    void prepare();
  }, [currentUser?.id, paymentDialogOpen]);

  useEffect(() => {
    if (!paymentDialogOpen || !paymentClientSecret || !stripePublishableKey) {
      return;
    }
    let isActive = true;
    let paymentElement: StripePaymentElement | null = null;

    const mountElement = async () => {
      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe || !isActive) {
        return;
      }
      const elements = stripe.elements({ clientSecret: paymentClientSecret });
      if (!paymentElementRef.current) {
        return;
      }
      paymentElement = elements.create("payment");
      paymentElement.mount(paymentElementRef.current);
      setStripeInstance(stripe);
      setStripeElements(elements);
    };

    void mountElement();

    return () => {
      isActive = false;
      if (paymentElement) {
        paymentElement.destroy();
      }
      setStripeInstance(null);
      setStripeElements(null);
    };
  }, [paymentClientSecret, paymentDialogOpen]);

  if (isAuthLoading || isUserLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "creator") {
    return (
      <div className="text-muted-foreground">
        This section is only available to creators.
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
          role: "creator",
          returnUrl: `${origin}/creator/settings`,
          refreshUrl: `${origin}/creator/settings`,
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
    setConnectError(null);
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
      setConnectError(message);
    } finally {
      setIsManaging(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setPaymentMethodError(null);
    setIsOpeningPaymentDialog(true);
    try {
      if (!stripePublishableKey) {
        throw new Error("Missing Stripe publishable key.");
      }
      setPaymentDialogOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to open payment setup.";
      setPaymentMethodError(message);
    } finally {
      setIsOpeningPaymentDialog(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["user", authUserId ?? "none"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["payment-methods", authUserId ?? "none"],
    });
    setPaymentDialogOpen(false);
  };

  const handleAutoChargeToggle = async (enabled: boolean) => {
    if (!currentUser) return;
    setPaymentMethodError(null);
    setIsUpdatingAutoCharge(true);
    try {
      const response = await fetch(
        `/api/users/${currentUser.id}/auto-charge`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to update auto-charge.");
      }
      await queryClient.invalidateQueries({
        queryKey: ["user", authUserId ?? "none"],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update auto-charge.";
      setPaymentMethodError(message);
    } finally {
      setIsUpdatingAutoCharge(false);
    }
  };

  const handleSavePaymentMethod = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!stripeInstance || !stripeElements || !currentUser) {
      return;
    }
    setIsSavingPayment(true);
    setPaymentSetupError(null);
    try {
      const result = await stripeInstance.confirmSetup({
        elements: stripeElements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to save payment method.");
      }

      if (!result.setupIntent?.id) {
        throw new Error("Setup intent not available.");
      }

      const response = await fetch("/api/creator/payment-methods/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          setupIntentId: result.setupIntent.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save payment method.");
      }

      await handlePaymentSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save payment method.";
      setPaymentSetupError(message);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const paymentDetailsLabel = (
    method: (typeof paymentMethods)[number],
  ) => {
    if (method.type === "us_bank_account") {
      const bank = method.bankName ?? "Bank account";
      const last4 = method.last4 ? `•••• ${method.last4}` : "";
      return `${bank} ${last4}`.trim();
    }
    const brand = method.brand ?? "Card";
    const last4 = method.last4 ? `•••• ${method.last4}` : "";
    const exp =
      method.expMonth && method.expYear
        ? `Exp ${method.expMonth}/${method.expYear}`
        : "";
    return `${brand} ${last4} ${exp}`.trim();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
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

      {/* Stripe Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stripe Connection</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectError ? (
            <p className="text-sm text-destructive">{connectError}</p>
          ) : null}
          {currentUser.stripeConnectedAccountId ? (
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
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Stripe account to start receiving affiliate
                payments and manage payouts.
              </p>
              <Button onClick={handleConnectStripe} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Stripe Account"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <CardDescription>
            Add a card or bank account for automatic platform charges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethodError ? (
            <p className="text-sm text-destructive">{paymentMethodError}</p>
          ) : null}
          {isPaymentMethodsLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading payment methods...
            </p>
          ) : paymentMethods.length === 0 ? (
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">No payment methods</p>
                  <p className="text-sm text-muted-foreground">
                    Add a card or bank account to pay platform fees.
                  </p>
                </div>
              </div>
              <Badge variant="outline">Missing</Badge>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between gap-4 p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.type === "us_bank_account"
                          ? "Bank account"
                          : "Card"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {paymentDetailsLabel(method)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault ? (
                      <Badge variant="outline">Default</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={setDefaultPaymentMethod.isPending}
                        onClick={() =>
                          setDefaultPaymentMethod.mutate(method.id, {
                            onError: (error) => {
                              const message =
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update default payment method.";
                              setPaymentMethodError(message);
                            },
                          })
                        }
                      >
                        Make default
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="font-medium">Auto-charge enabled</p>
              <p className="text-sm text-muted-foreground">
                Automatically charge your saved payment method to pay platform
                fees.
              </p>
            </div>
            <Switch
              checked={Boolean(currentUser.autoChargeEnabled)}
              disabled={isUpdatingAutoCharge || paymentMethods.length === 0}
              onCheckedChange={handleAutoChargeToggle}
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddPaymentMethod}
            disabled={isOpeningPaymentDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isOpeningPaymentDialog ? "Opening..." : "Add card or bank account"}
          </Button>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add card or bank account</DialogTitle>
                <DialogDescription>
                  Your payment method will be saved securely with Stripe for
                  future platform charges.
                </DialogDescription>
              </DialogHeader>
              {paymentSetupError ? (
                <p className="text-sm text-destructive">{paymentSetupError}</p>
              ) : null}
              {!stripePublishableKey ? (
                <p className="text-sm text-destructive">
                  Stripe publishable key is missing.
                </p>
              ) : null}
              {isPreparingPayment ? (
                <p className="text-sm text-muted-foreground">
                  Preparing payment form...
                </p>
              ) : null}
              {paymentClientSecret && stripePublishableKey ? (
                <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                  <div className="rounded-md border p-3">
                    <div ref={paymentElementRef} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!stripeInstance || isSavingPayment}
                  >
                    {isSavingPayment ? "Saving..." : "Save payment method"}
                  </Button>
                </form>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Settings</CardTitle>
          <CardDescription>
            Configure how affiliate commissions are paid out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Payout Schedule</Label>
            <p className="text-sm text-muted-foreground">
              Affiliates are paid on the 1st of each month for the previous
              month&apos;s earnings.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Minimum Payout</Label>
            <p className="text-sm text-muted-foreground">
              $50.00 minimum before payout is processed.
            </p>
          </div>
        </CardContent>
      </Card>

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
            This action cannot be undone. All your projects and data will be
            permanently deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
