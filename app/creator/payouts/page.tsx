"use client";

import { formatCurrency } from "@/lib/data/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { DollarSign, Clock, CheckCircle, Percent, Info } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import {
  useCreatorPayouts,
  useCreatorPaymentCharge,
  useCreatorPaymentCheckout,
  useCreatorPaymentPreview,
  useCreatorPayments,
  useCreatorPurchaseDetails,
  useCreatorAdjustments,
  useProcessMarketerTransfers,
} from "@/lib/hooks/creator";
import { usePaymentMethods } from "@/lib/hooks/payment-methods";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type HeaderInfoProps = {
  label: string;
  help: string;
};

function HeaderWithInfo({ label, help }: HeaderInfoProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="h-4 px-1 text-[10px] leading-none">
            i
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <p className="text-xs">{help}</p>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

type DateTimeAlign = "left" | "right";

function renderDateTime(value?: string | Date | null, align: DateTimeAlign = "left") {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  const date = new Date(value);
  const alignClass = align === "right" ? "items-end text-right" : "items-start";

  return (
    <div className={`flex flex-col ${alignClass} leading-tight`}>
      <span>{date.toLocaleDateString()}</span>
      <span className="text-xs text-muted-foreground">
        {date.toLocaleTimeString()}
      </span>
    </div>
  );
}

function paymentMethodLabel(method: {
  type: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  bankName?: string | null;
}) {
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

export default function PayoutsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data, isLoading: isPayoutsLoading } = useCreatorPayouts(
    currentUser?.id,
  );
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [transferResults, setTransferResults] = useState<
    Array<{
      marketerId: string;
      marketerAccountId: string;
      purchaseCount: number;
      status: string;
      error?: string;
    }>
  >([]);
  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useCreatorPaymentPreview(currentUser?.id, isReceiptOpen);
  const { data: payments = [], isLoading: isPaymentsLoading } =
    useCreatorPayments(currentUser?.id);
  const { data: purchases = [], isLoading: isPurchasesLoading } =
    useCreatorPurchaseDetails(currentUser?.id);
  const { data: adjustments = [], isLoading: isAdjustmentsLoading } =
    useCreatorAdjustments(currentUser?.id);
  const { data: paymentMethods = [] } = usePaymentMethods(currentUser?.id);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const commissionPurchases = purchases.filter(
    (purchase) => purchase.commissionAmount > 0,
  );
  const checkout = useCreatorPaymentCheckout();
  const charge = useCreatorPaymentCharge();
  const processTransfers = useProcessMarketerTransfers();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const defaultPaymentMethod = paymentMethods.find((method) => method.isDefault);

  useEffect(() => {
    if (!selectedPaymentMethodId && paymentMethods.length > 0) {
      setSelectedPaymentMethodId(
        defaultPaymentMethod?.id ?? paymentMethods[0]?.id ?? null,
      );
    }
  }, [defaultPaymentMethod?.id, paymentMethods, selectedPaymentMethodId]);

  useEffect(() => {
    const status = searchParams.get("payment");
    if (status === "success") {
      toast.success("Payment received. Platform will process payouts next.");
      router.replace("/creator/payouts");
    }
  }, [router, searchParams]);

  if (
    isAuthLoading ||
    isUserLoading ||
    isPayoutsLoading ||
    isPaymentsLoading ||
    isPurchasesLoading ||
    isAdjustmentsLoading
  ) {
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

  const payouts = data?.payouts ?? [];
  const totals = data?.totals ?? {
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    pendingCreatorCommissions: 0,
    awaitingRefundCommissions: 0,
    readyCommissions: 0,
    failedCommissions: 0,
    platformFee: 0,
    platformCommissionPercent: null,
  };
  const outstandingCommissions =
    totals.pendingCommissions + totals.failedCommissions;
  const totalAdjustments = adjustments.reduce(
    (sum, adjustment) => sum + adjustment.amount,
    0,
  );
  const hasPending = totals.pendingCreatorCommissions > 0;
  const readyTotal = payouts.reduce(
    (sum, payout) => sum + (payout.netReadyEarnings ?? payout.readyEarnings),
    0,
  );
  const hasReady = readyTotal > 0;

  const handlePayAll = async () => {
    if (!currentUser) return;
    setCheckoutError(null);
    setChargeError(null);
    setIsReceiptOpen(true);
  };

  const handleChargePaymentMethod = async () => {
    if (!currentUser) return;
    setChargeError(null);
    try {
      const result = await charge.mutateAsync({
        userId: currentUser.id,
        paymentMethodId: selectedPaymentMethodId ?? undefined,
      });
      if (result.status !== "succeeded") {
        throw new Error("Payment requires additional verification.");
      }
      toast.success("Payment received. Platform will process payouts next.");
      setIsReceiptOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["creator-payment-preview", currentUser.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["creator-payments", currentUser.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["creator-payouts", currentUser.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["creator-payout-purchases", currentUser.id],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to charge payment method.";
      setChargeError(message);
    }
  };

  const handleCreateCheckout = async () => {
    if (!currentUser) return;
    try {
      const result = await checkout.mutateAsync({ userId: currentUser.id });
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

  const handleProcessTransfers = async () => {
    if (!currentUser) return;
    try {
      const result = await processTransfers.mutateAsync({
        creatorId: currentUser.id,
      });
      const results = Array.isArray(result?.results) ? result.results : [];
      setTransferResults(results);
      const skipped = results.filter(
        (item: { status?: string }) => item.status === "SKIPPED",
      );
      if (skipped.length > 0) {
        toast.message(
          "No transfers processed for some marketers because adjustments offset the payout.",
        );
      } else if (results.length === 0) {
        toast.message("No transfers to process yet.");
      } else {
        toast.success("Transfers processed.");
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["creator-payouts", currentUser.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["creator-payout-purchases", currentUser.id],
        }),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process transfers.";
      toast.error(message);
    }
  };

  const getEffectiveCommissionStatus = (purchase: {
    commissionStatus: string;
    refundEligibleAt?: string | Date | null;
  }) => {
    if (purchase.commissionStatus !== "awaiting_refund_window") {
      return purchase.commissionStatus;
    }
    if (!purchase.refundEligibleAt) {
      return purchase.commissionStatus;
    }
    return new Date(purchase.refundEligibleAt) <= now
      ? "pending_creator_payment"
      : "awaiting_refund_window";
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Payouts</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleProcessTransfers}
              disabled={!hasReady || processTransfers.isPending}
            >
              {processTransfers.isPending
                ? "Processing transfers..."
                : "Process marketer transfers"}
            </Button>
            <Button onClick={handlePayAll} disabled={!hasPending}>
              Pay all
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Track and manage affiliate commission payouts.
        </p>
      </div>

      {transferResults.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Transfer Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marketer</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferResults.map((item) => {
                    const marketer = payouts.find(
                      (entry) => entry.marketerId === item.marketerId,
                    );
                    return (
                      <TableRow key={`${item.marketerId}-${item.marketerAccountId}`}>
                        <TableCell className="font-medium">
                          {marketer?.marketerName ?? "Marketer"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.purchaseCount}
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="outline">{item.status.toLowerCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.error ?? "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Commissions"
          value={formatCurrency(totals.totalCommissions)}
          description="All time"
          icon={DollarSign}
        />
        <StatCard
          title="Paid Out"
          value={formatCurrency(totals.paidCommissions)}
          description="Successfully paid"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(outstandingCommissions)}
          description="Awaiting payout"
          icon={Clock}
        />
        <StatCard
          title="Platform Fee"
          value={
            totals.platformCommissionPercent == null
              ? "Varies"
              : `${Math.round(totals.platformCommissionPercent * 100)}%`
          }
          description="Of marketer commission"
          icon={Percent}
        />
      </div>

      {/* Marketer Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affiliate Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No affiliate earnings to pay out yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketer</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="Total Earned"
                      help="All commissions generated by this marketer."
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="Paid"
                      help="Commissions already paid out to the marketer."
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="To Pay"
                      help="Commissions awaiting creator payment."
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="Ready"
                      help="Creator has paid; platform can transfer now."
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="Net Ready"
                      help="Ready minus adjustments."
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="Refund window"
                      help="Awaiting refund window before payout is ready."
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <HeaderWithInfo
                      label="Failed"
                      help="Transfer attempts that failed."
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => {
                  const paid = payout.paidEarnings;
                  const awaitingCreator = payout.awaitingCreatorEarnings;
                  const awaitingRefund = payout.awaitingRefundEarnings;
                  const failed = payout.failedEarnings;
                  const ready = payout.readyEarnings;
                  const netReady = payout.netReadyEarnings ?? payout.readyEarnings;

                  return (
                    <TableRow key={payout.marketerId}>
                      <TableCell className="font-medium">
                        {payout.marketerName}
                      </TableCell>
                      <TableCell className="text-right">
                        {payout.projectCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payout.totalEarnings)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(paid)}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {formatCurrency(awaitingCreator)}
                      </TableCell>
                      <TableCell className="text-right text-sky-400">
                        {formatCurrency(ready)}
                      </TableCell>
                      <TableCell className="text-right text-sky-400">
                        {formatCurrency(netReady)}
                      </TableCell>
                      <TableCell className="text-right text-amber-500">
                        {formatCurrency(awaitingRefund)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(failed)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {awaitingCreator > 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          ) : awaitingRefund > 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Refund window
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start">
                                <div className="max-w-xs text-xs leading-relaxed">
                                  Commissions are held until the refund window
                                  expires.
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : failed > 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Failed
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start">
                                <div className="max-w-xs text-xs leading-relaxed">
                                  {payout.failureReason ??
                                    "Transfer failed. Check Stripe for details."}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : ready > 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Ready
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="gap-1 bg-green-600 text-white"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Paid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketer Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {commissionPurchases.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No purchases yet.
            </p>
          ) : (
            payouts.map((payout) => {
              const marketerPurchases = commissionPurchases.filter(
                (purchase) => purchase.marketer?.id === payout.marketerId,
              );
              const awaitingCreator = payout.awaitingCreatorEarnings;
              const awaitingRefund = payout.awaitingRefundEarnings;

              if (marketerPurchases.length === 0) {
                return null;
              }

              return (
                <div key={payout.marketerId} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{payout.marketerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ready:{" "}
                        {formatCurrency(payout.netReadyEarnings ?? payout.readyEarnings)}{" "}
                        · Awaiting Creator: {formatCurrency(awaitingCreator)} ·
                        Refund window: {formatCurrency(awaitingRefund)} ·
                        Adjustments: {formatCurrency(payout.adjustmentsTotal ?? 0)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {payout.marketerEmail ?? "Marketer"}
                    </Badge>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Coupon</TableHead>
                          <TableHead className="text-right">
                            <HeaderWithInfo
                              label="Amount"
                              help="Customer payment total."
                            />
                          </TableHead>
                          <TableHead className="text-right">
                            <HeaderWithInfo
                              label="Commission"
                              help="Amount owed to the marketer."
                            />
                          </TableHead>
                          <TableHead className="text-right">
                            <HeaderWithInfo
                              label="Platform"
                              help="Platform fee based on the commission."
                            />
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Refund Ends</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketerPurchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell className="font-medium">
                              {purchase.projectName}
                            </TableCell>
                            <TableCell>
                              {purchase.couponCode ? (
                                <Badge variant="secondary">
                                  {purchase.couponCode}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.commissionAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.platformFee)}
                            </TableCell>
                            <TableCell>
                              {getEffectiveCommissionStatus(purchase) ===
                              "ready_for_payout" ? (
                                <Badge variant="outline">Ready</Badge>
                              ) : getEffectiveCommissionStatus(purchase) ===
                                "awaiting_refund_window" ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline">Refund window</Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" align="start">
                                    <div className="max-w-xs text-xs leading-relaxed">
                                      Waiting for the refund window to pass
                                      before commission becomes payable.
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : getEffectiveCommissionStatus(purchase) ===
                                "pending_creator_payment" ? (
                                <Badge variant="secondary">Awaiting Creator</Badge>
                              ) : getEffectiveCommissionStatus(purchase) ===
                                "refunded" ? (
                                <Badge variant="destructive">Refunded</Badge>
                              ) : getEffectiveCommissionStatus(purchase) ===
                                "chargeback" ? (
                                <Badge variant="destructive">Chargeback</Badge>
                              ) : (
                                <Badge className="bg-green-600 text-white">Paid</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {renderDateTime(purchase.refundEligibleAt, "right")}
                            </TableCell>
                            <TableCell className="text-right">
                              {renderDateTime(purchase.createdAt, "right")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No adjustments recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Net adjustments: {formatCurrency(totalAdjustments)}
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Marketer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>
                          {renderDateTime(adjustment.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {adjustment.marketerName}
                          {adjustment.marketerEmail ? (
                            <p className="text-xs text-muted-foreground">
                              {adjustment.marketerEmail}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>{adjustment.projectName}</TableCell>
                        <TableCell className="capitalize">
                          {adjustment.reason.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(adjustment.amount, adjustment.currency)}
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="outline">
                            {adjustment.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Paying the platform consolidates marketer and
            platform commissions. Once paid, the platform can process transfers
            to marketers separately.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No payments recorded yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Marketer</TableHead>
                    <TableHead className="text-right">Platform</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{renderDateTime(payment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {payment.purchaseCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.marketerTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.platformFeeTotal)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amountTotal)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Commission Receipt</DialogTitle>
            <DialogDescription>
              Review commissions before paying the platform.
            </DialogDescription>
          </DialogHeader>
          {isPreviewLoading ? (
            <p className="text-sm text-muted-foreground">Loading receipt...</p>
          ) : previewError ? (
            <p className="text-sm text-destructive">
              {previewError instanceof Error
                ? previewError.message
                : "Failed to load receipt."}
            </p>
          ) : preview && preview.purchases.length > 0 ? (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Reduce processing fees</AlertTitle>
                <AlertDescription>
                  Add a payment method and enable auto-charge so platform
                  payments can be collected automatically without the processing
                  fee.{" "}
                  <Link
                    href="/creator/settings"
                    className="underline underline-offset-4 text-foreground"
                  >
                    Update payment methods
                  </Link>
                  .
                </AlertDescription>
              </Alert>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Marketer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Marketer</TableHead>
                      <TableHead className="text-right">Platform</TableHead>
                      <TableHead className="text-right">Merchant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.projectName}
                          {purchase.customerEmail ? (
                            <p className="text-xs text-muted-foreground">
                              {purchase.customerEmail}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>{purchase.marketerName}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(purchase.amount, purchase.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            purchase.marketerCommission,
                            purchase.currency,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(purchase.platformFee, purchase.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(purchase.merchantNet, purchase.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-3">Summary by marketer</p>
                <div className="space-y-2">
                  {preview.perMarketer.map((entry) => (
                    <div key={entry.marketerId ?? "direct"} className="flex justify-between text-sm">
                      <span>{entry.marketerName}</span>
                      <span>
                        {entry.currency
                          ? `${formatCurrency(entry.marketerTotal, entry.currency)} + ${formatCurrency(
                              entry.platformTotal,
                              entry.currency,
                            )}`
                          : "Multiple currencies"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span>Marketer commissions</span>
                    <span>
                      {preview.totals.currency
                        ? formatCurrency(
                            preview.totals.marketerTotal,
                            preview.totals.currency,
                          )
                        : "Multiple currencies"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform commissions</span>
                    <span>
                      {preview.totals.currency
                        ? formatCurrency(
                            preview.totals.platformTotal,
                            preview.totals.currency,
                          )
                        : "Multiple currencies"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing fee</span>
                    <span>
                      {preview.totals.currency
                        ? formatCurrency(
                            preview.totals.processingFee,
                            preview.totals.currency,
                          )
                        : "Multiple currencies"}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total due</span>
                    <span>
                      {preview.totals.currency
                        ? formatCurrency(
                            preview.totals.totalWithFee,
                            preview.totals.currency,
                          )
                        : "Multiple currencies"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No outstanding commissions to pay.
            </p>
          )}
          {paymentMethods.length > 0 ? (
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">Charge a saved payment method</p>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
              Close
            </Button>
            {paymentMethods.length > 0 ? (
              <Button
                variant="secondary"
                onClick={handleChargePaymentMethod}
                disabled={
                  charge.isPending ||
                  checkout.isPending ||
                  !selectedPaymentMethodId
                }
              >
                {charge.isPending ? "Charging..." : "Pay with saved method"}
              </Button>
            ) : null}
            <Button
              onClick={handleCreateCheckout}
              disabled={
                checkout.isPending ||
                charge.isPending ||
                !preview?.totals.grandTotal
              }
            >
              {checkout.isPending ? "Creating checkout..." : "Proceed to pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
