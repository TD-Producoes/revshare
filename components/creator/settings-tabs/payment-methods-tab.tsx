"use client";

import { CreditCard, Plus } from "lucide-react";
import type { FormEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethod } from "@/lib/hooks/payment-methods";

type PaymentMethodsTabProps = {
  paymentMethods: PaymentMethod[];
  paymentMethodError: string | null;
  isPaymentMethodsLoading: boolean;
  isOpeningPaymentDialog: boolean;
  isUpdatingAutoCharge: boolean;
  autoChargeEnabled: boolean;
  paymentDialogOpen: boolean;
  paymentSetupError: string | null;
  isPreparingPayment: boolean;
  paymentClientSecret: string | null;
  stripePublishableKey: string;
  isSavingPayment: boolean;
  canSavePayment: boolean;
  paymentElementRef: RefObject<HTMLDivElement>;
  onAddPaymentMethod: () => void;
  onAutoChargeToggle: (enabled: boolean) => void;
  onConfirmRemovePaymentMethod: (method: PaymentMethod) => void;
  onMakeDefault: (methodId: string) => void;
  onCloseDialog: (open: boolean) => void;
  onSavePaymentMethod: (event: FormEvent<HTMLFormElement>) => void;
  isSettingDefault: boolean;
  isRemoving: boolean;
};

export function CreatorPaymentMethodsTab({
  paymentMethods,
  paymentMethodError,
  isPaymentMethodsLoading,
  isOpeningPaymentDialog,
  isUpdatingAutoCharge,
  autoChargeEnabled,
  paymentDialogOpen,
  paymentSetupError,
  isPreparingPayment,
  paymentClientSecret,
  stripePublishableKey,
  isSavingPayment,
  canSavePayment,
  paymentElementRef,
  onAddPaymentMethod,
  onAutoChargeToggle,
  onConfirmRemovePaymentMethod,
  onMakeDefault,
  onCloseDialog,
  onSavePaymentMethod,
  isSettingDefault,
  isRemoving,
}: PaymentMethodsTabProps) {
  const paymentDetailsLabel = (method: PaymentMethod) => {
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
                      disabled={isSettingDefault}
                      onClick={() => onMakeDefault(method.id)}
                    >
                      Make default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={isRemoving}
                    onClick={() => onConfirmRemovePaymentMethod(method)}
                  >
                    Remove
                  </Button>
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
            checked={autoChargeEnabled}
            disabled={isUpdatingAutoCharge || paymentMethods.length === 0}
            onCheckedChange={onAutoChargeToggle}
          />
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onAddPaymentMethod}
          disabled={isOpeningPaymentDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isOpeningPaymentDialog ? "Opening..." : "Add card or bank account"}
        </Button>
        <Dialog open={paymentDialogOpen} onOpenChange={onCloseDialog}>
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
              <form onSubmit={onSavePaymentMethod} className="space-y-4">
                <div className="rounded-md border p-3">
                  <div ref={paymentElementRef} />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSavePayment || isSavingPayment}
                >
                  {isSavingPayment ? "Saving..." : "Save payment method"}
                </Button>
              </form>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onCloseDialog(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
