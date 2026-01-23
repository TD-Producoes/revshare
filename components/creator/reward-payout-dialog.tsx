"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/data/metrics";
import {
  CreatorRewardPayoutGroup,
  useCreatorRewardPayoutCharge,
  useCreatorRewardPayoutCheckout,
} from "@/lib/hooks/creator";
import { PaymentMethod } from "@/lib/hooks/payment-methods";

type RewardPayoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CreatorRewardPayoutGroup | null;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId?: string | null;
  onPaid?: () => void | Promise<void>;
};

function calculateProcessingFee(amountOwed: number) {
  const stripePercentage = 0.029;
  const fixedFee = 30;
  const fee = (amountOwed + fixedFee) / (1 - stripePercentage) - amountOwed;
  return Math.max(0, Math.round(fee));
}

function renderDateTime(value?: string | Date | null) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  const date = new Date(value);
  return (
    <div className="flex flex-col items-end text-right leading-tight">
      <span>{date.toLocaleDateString()}</span>
      <span className="text-xs text-muted-foreground">
        {date.toLocaleTimeString()}
      </span>
    </div>
  );
}

function paymentMethodLabel(method: PaymentMethod) {
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
}

export function RewardPayoutDialog({
  open,
  onOpenChange,
  group,
  paymentMethods,
  defaultPaymentMethodId,
  onPaid,
}: RewardPayoutDialogProps) {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const charge = useCreatorRewardPayoutCharge();
  const checkout = useCreatorRewardPayoutCheckout();

  const totals = useMemo(() => {
    const amount = group?.totalAmount ?? 0;
    const processingFee = calculateProcessingFee(amount);
    return {
      amount,
      processingFee,
      totalWithFee: amount + processingFee,
      currency: group?.currency ?? "USD",
    };
  }, [group]);

  const perMarketer = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    (group?.items ?? []).forEach((item) => {
      const existing = map.get(item.marketerId) ?? {
        name: item.marketerName,
        total: 0,
      };
      existing.total += item.amount;
      map.set(item.marketerId, existing);
    });
    return Array.from(map.entries()).map(([marketerId, data]) => ({
      marketerId,
      name: data.name,
      total: data.total,
    }));
  }, [group]);

  useEffect(() => {
    if (!open) {
      setChargeError(null);
      setCheckoutError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!selectedPaymentMethodId && paymentMethods.length > 0) {
      setSelectedPaymentMethodId(
        defaultPaymentMethodId ?? paymentMethods[0]?.id ?? null,
      );
    }
  }, [defaultPaymentMethodId, paymentMethods, selectedPaymentMethodId]);

  const handleCharge = async () => {
    if (!group) return;
    setChargeError(null);
    setCheckoutError(null);
    try {
      const result = await charge.mutateAsync({
        currency: group.currency,
        paymentMethodId: selectedPaymentMethodId ?? undefined,
      });
      if (result.status !== "succeeded") {
        throw new Error("Payment requires additional verification.");
      }
      toast.success("Reward payment received. Transfers are processing.");
      onOpenChange(false);
      await onPaid?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to charge payment method.";
      setChargeError(message);
    }
  };

  const handleCheckout = async () => {
    if (!group) return;
    setCheckoutError(null);
    setChargeError(null);
    try {
      const result = await checkout.mutateAsync({ currency: group.currency });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      setCheckoutError("Checkout URL missing.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create checkout.";
      setCheckoutError(message);
    }
  };

  const hasItems = (group?.items?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Reward Receipt</DialogTitle>
          <DialogDescription>
            Review cash rewards before paying marketers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full min-h-0 px-6">
            <div className="py-4 space-y-4">
              {!hasItems ? (
                <p className="text-sm text-muted-foreground">
                  No cash rewards ready to pay.
                </p>
              ) : (
                <>
                  {paymentMethods.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Reduce processing fees</AlertTitle>
                      <AlertDescription>
                        Add a payment method and enable auto-charge so reward
                        payments can be collected automatically without the
                        processing fee.{" "}
                        <Link
                          href="/founder/settings"
                          className="underline underline-offset-4 text-foreground"
                        >
                          Update payment methods
                        </Link>
                        .
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Marketer</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Reward</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Earned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group?.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.marketerName}
                              {item.marketerEmail ? (
                                <p className="text-xs text-muted-foreground">
                                  {item.marketerEmail}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell>{item.projectName}</TableCell>
                            <TableCell>{item.rewardName}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.amount, item.currency)}
                            </TableCell>
                            <TableCell className="text-right">
                              {renderDateTime(item.earnedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-4">
                    <p className="text-sm font-medium mb-3">
                      Summary by marketer
                    </p>
                    <div className="space-y-2">
                      {perMarketer.map((entry) => (
                        <div
                          key={entry.marketerId}
                          className="flex justify-between text-sm"
                        >
                          <span>{entry.name}</span>
                          <span>
                            {formatCurrency(entry.total, totals.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t pt-3 text-sm">
                      <div className="flex justify-between">
                        <span>Reward payouts</span>
                        <span>
                          {formatCurrency(totals.amount, totals.currency)}
                        </span>
                      </div>
                      {paymentMethods.length === 0 ? (
                        <div className="flex justify-between">
                          <span>Processing fee</span>
                          <span>
                            {formatCurrency(
                              totals.processingFee,
                              totals.currency,
                            )}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between font-medium">
                        <span>Total due</span>
                        <span>
                          {formatCurrency(totals.totalWithFee, totals.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {paymentMethods.length > 0 ? (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    Charge a saved payment method
                  </p>
                  <Select
                    value={selectedPaymentMethodId ?? undefined}
                    onValueChange={(value) => setSelectedPaymentMethodId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {paymentMethodLabel(method)}
                          {method.isDefault ? " (Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a payment method to pay without going through checkout.
                </p>
              )}
              {chargeError ? (
                <p className="text-sm text-destructive">{chargeError}</p>
              ) : null}
              {checkoutError ? (
                <p className="text-sm text-destructive">{checkoutError}</p>
              ) : null}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {paymentMethods.length > 0 ? (
            <Button
              onClick={handleCharge}
              disabled={
                charge.isPending ||
                checkout.isPending ||
                !selectedPaymentMethodId ||
                !hasItems
              }
            >
              {charge.isPending ? "Charging..." : "Pay with saved method"}
            </Button>
          ) : null}
          {paymentMethods.length === 0 ? (
            <Button
              onClick={handleCheckout}
              disabled={checkout.isPending || charge.isPending || !hasItems}
            >
              {checkout.isPending ? "Creating checkout..." : "Proceed to pay"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
