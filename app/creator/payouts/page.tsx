"use client";

import { formatCurrency } from "@/lib/data/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DollarSign, Clock, CheckCircle, Percent } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import {
  useCreatorPayouts,
  useCreatorPaymentCheckout,
  useCreatorPaymentPreview,
  useCreatorPayments,
  useCreatorPurchaseDetails,
  useProcessMarketerTransfers,
} from "@/lib/hooks/creator";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export default function PayoutsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data, isLoading: isPayoutsLoading } = useCreatorPayouts(
    currentUser?.id,
  );
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useCreatorPaymentPreview(currentUser?.id, isReceiptOpen);
  const { data: payments = [], isLoading: isPaymentsLoading } =
    useCreatorPayments(currentUser?.id);
  const { data: purchases = [], isLoading: isPurchasesLoading } =
    useCreatorPurchaseDetails(currentUser?.id);
  const commissionPurchases = purchases.filter(
    (purchase) => purchase.commissionAmount > 0,
  );
  const checkout = useCreatorPaymentCheckout();
  const processTransfers = useProcessMarketerTransfers();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    isPurchasesLoading
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
    failedCommissions: 0,
    platformFee: 0,
  };
  const outstandingCommissions =
    totals.pendingCommissions + totals.failedCommissions;
  const hasPending = outstandingCommissions > 0;
  const readyTotal = payouts.reduce((sum, payout) => sum + payout.readyEarnings, 0);
  const hasReady = readyTotal > 0;

  const handlePayAll = async () => {
    if (!currentUser) return;
    setCheckoutError(null);
    setIsReceiptOpen(true);
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
      await processTransfers.mutateAsync({ creatorId: currentUser.id });
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
          value={formatCurrency(totals.platformFee)}
          description="5% of commissions"
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
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">To Pay</TableHead>
                  <TableHead className="text-right">Ready</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => {
                  const paid = payout.paidEarnings;
                  const pending = payout.pendingEarnings;
                  const retryable = payout.pendingEarnings + payout.failedEarnings;
                  const failed = payout.failedEarnings;
                  const ready = payout.readyEarnings;

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
                        {formatCurrency(retryable)}
                      </TableCell>
                      <TableCell className="text-right text-sky-400">
                        {formatCurrency(ready)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(failed)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {pending > 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
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
                          ) : (
                            <Badge
                              variant="default"
                              className="gap-1 bg-green-600"
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

              if (marketerPurchases.length === 0) {
                return null;
              }

              return (
                <div key={payout.marketerId} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{payout.marketerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ready: {formatCurrency(payout.readyEarnings)} · Awaiting
                        Creator: {formatCurrency(payout.pendingEarnings)}
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
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead className="text-right">Platform</TableHead>
                          <TableHead>Status</TableHead>
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
                              {purchase.commissionStatus === "ready_for_payout" ? (
                                <Badge variant="outline">Ready</Badge>
                              ) : purchase.commissionStatus ===
                                "pending_creator_payment" ? (
                                <Badge variant="secondary">Awaiting Creator</Badge>
                              ) : (
                                <Badge className="bg-green-600">Paid</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {new Date(purchase.createdAt).toLocaleDateString()}
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
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
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
                          {formatCurrency(purchase.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(purchase.marketerCommission)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(purchase.platformFee)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(purchase.merchantNet)}
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
                        {formatCurrency(entry.marketerTotal)} +{" "}
                        {formatCurrency(entry.platformTotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span>Marketer commissions</span>
                    <span>{formatCurrency(preview.totals.marketerTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform commissions</span>
                    <span>{formatCurrency(preview.totals.platformTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total due</span>
                    <span>{formatCurrency(preview.totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No outstanding commissions to pay.
            </p>
          )}
          {checkoutError ? (
            <p className="text-sm text-destructive">{checkoutError}</p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleCreateCheckout}
              disabled={checkout.isPending || !preview?.totals.grandTotal}
            >
              {checkout.isPending ? "Creating checkout..." : "Proceed to pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
