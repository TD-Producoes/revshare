"use client";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import {
  usePaymentMethods,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
} from "@/lib/hooks/payment-methods";
import { useProjects } from "@/lib/hooks/projects";
import { CreatorAccountTab } from "@/components/creator/settings-tabs/account-tab";
import { CreatorPaymentMethodsTab } from "@/components/creator/settings-tabs/payment-methods-tab";
import { CreatorProjectsTab } from "@/components/creator/settings-tabs/projects-tab";
import { CreatorNotificationsTab } from "@/components/creator/settings-tabs/notifications-tab";
import { CreatorPayoutsTab } from "@/components/creator/settings-tabs/payouts-tab";
import { CreatorDangerTab } from "@/components/creator/settings-tabs/danger-tab";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUBLISHABLE_KEY ?? "";

export default function SettingsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: paymentMethods = [], isLoading: isPaymentMethodsLoading } =
    usePaymentMethods(authUserId);
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects(
    authUserId,
  );
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod(authUserId);
  const removePaymentMethod = useRemovePaymentMethod(authUserId);
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
  const paymentElementRef = useRef<HTMLDivElement>(null!);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [savingCurrencyId, setSavingCurrencyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("account");

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

  const handleCurrencyChange = async (projectId: string, currency: string) => {
    if (!currentUser) return;
    setCurrencyError(null);
    setSavingCurrencyId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, currency }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to update currency.");
      }
      await queryClient.invalidateQueries({
        queryKey: ["projects", authUserId ?? "all"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update currency.";
      setCurrencyError(message);
    } finally {
      setSavingCurrencyId(null);
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

  const handleRemovePaymentMethod = (methodId: string) => {
    setPaymentMethodError(null);
    removePaymentMethod.mutate(methodId, {
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to remove payment method.";
        setPaymentMethodError(message);
      },
    });
  };

  const confirmRemovePaymentMethod = (
    method: (typeof paymentMethods)[number],
  ) => {
    toast("Remove payment method?", {
      description: [
        method.type === "us_bank_account"
          ? method.bankName ?? "Bank account"
          : method.brand ?? "Card",
        method.last4 ? `•••• ${method.last4}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      duration: Infinity,
      action: {
        label: "Remove",
        onClick: () => handleRemovePaymentMethod(method.id),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
      position: "top-center",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger className="px-3 py-2 text-sm" value="account">
              Account
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="payments">
              Payments
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="projects">
              Projects
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="notifications">
              Notifications
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="payouts">
              Payouts
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="danger">
              Danger
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account">
          <CreatorAccountTab
            name={currentUser.name}
            email={currentUser.email}
            role={currentUser.role}
            profileUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="payments">
          <CreatorPaymentMethodsTab
            paymentMethods={paymentMethods}
            paymentMethodError={paymentMethodError}
            isPaymentMethodsLoading={isPaymentMethodsLoading}
            isOpeningPaymentDialog={isOpeningPaymentDialog}
            isUpdatingAutoCharge={isUpdatingAutoCharge}
            autoChargeEnabled={Boolean(currentUser.autoChargeEnabled)}
            paymentDialogOpen={paymentDialogOpen}
            paymentSetupError={paymentSetupError}
            isPreparingPayment={isPreparingPayment}
            paymentClientSecret={paymentClientSecret}
            stripePublishableKey={stripePublishableKey}
            isSavingPayment={isSavingPayment}
            canSavePayment={Boolean(stripeInstance)}
            paymentElementRef={paymentElementRef}
            onAddPaymentMethod={handleAddPaymentMethod}
            onAutoChargeToggle={handleAutoChargeToggle}
            onConfirmRemovePaymentMethod={confirmRemovePaymentMethod}
            onMakeDefault={(methodId) =>
              setDefaultPaymentMethod.mutate(methodId, {
                onError: (error) => {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Failed to update default payment method.";
                  setPaymentMethodError(message);
                },
              })
            }
            onCloseDialog={setPaymentDialogOpen}
            onSavePaymentMethod={handleSavePaymentMethod}
            isSettingDefault={setDefaultPaymentMethod.isPending}
            isRemoving={removePaymentMethod.isPending}
          />
        </TabsContent>

        <TabsContent value="projects">
          <CreatorProjectsTab
            projects={projects}
            isLoading={isProjectsLoading}
            savingCurrencyId={savingCurrencyId}
            currencyError={currencyError}
            onCurrencyChange={handleCurrencyChange}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <CreatorNotificationsTab userId={currentUser.id} />
        </TabsContent>

        <TabsContent value="payouts">
          <CreatorPayoutsTab />
        </TabsContent>

        <TabsContent value="danger">
          <CreatorDangerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
