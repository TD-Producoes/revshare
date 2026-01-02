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
import { DollarSign, Clock, CheckCircle, TrendingUp, Timer, Info } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useContractsForMarketer } from "@/lib/hooks/contracts";
import { useMarketerAdjustments, useMarketerPurchases } from "@/lib/hooks/marketer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function EarningsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: purchases = [], isLoading: isPurchasesLoading } =
    useMarketerPurchases(currentUser?.id);
  const {
    data: adjustmentsPayload,
    isLoading: isAdjustmentsLoading,
  } = useMarketerAdjustments(currentUser?.id);
  const adjustments = adjustmentsPayload?.data ?? [];
  const pendingAdjustmentsTotal = adjustmentsPayload?.pendingTotal ?? 0;
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);

  if (
    isAuthLoading ||
    isUserLoading ||
    isPurchasesLoading ||
    isContractsLoading ||
    isAdjustmentsLoading
  ) {
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

  const now = new Date();
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

  const totals = purchases.reduce(
    (acc, purchase) => {
      const effectiveStatus = getEffectiveCommissionStatus(purchase);
      if (effectiveStatus === "refunded" || effectiveStatus === "chargeback") {
        return acc;
      }
      acc.totalRevenue += purchase.amount;
      acc.totalEarnings += purchase.commissionAmount;
      switch (effectiveStatus) {
        case "paid":
          acc.paid += purchase.commissionAmount;
          break;
        case "ready_for_payout":
          acc.ready += purchase.commissionAmount;
          break;
        case "awaiting_refund_window":
          acc.awaitingRefund += purchase.commissionAmount;
          break;
        case "pending_creator_payment":
          acc.awaitingCreator += purchase.commissionAmount;
          break;
        default:
          break;
      }
      return acc;
    },
    {
      totalRevenue: 0,
      totalEarnings: 0,
      paid: 0,
      ready: 0,
      awaitingRefund: 0,
      awaitingCreator: 0,
    },
  );

  const contractByProject = new Map(
    contracts.map((contract) => [contract.projectId, contract]),
  );

  const projectEarnings = purchases.reduce(
    (acc, purchase) => {
      const effectiveStatus = getEffectiveCommissionStatus(purchase);
      if (effectiveStatus === "refunded" || effectiveStatus === "chargeback") {
        return acc;
      }
      const existing = acc.get(purchase.projectId) ?? {
        projectId: purchase.projectId,
        projectName: purchase.projectName,
        purchaseCount: 0,
        totalRevenue: 0,
        totalEarnings: 0,
        paidEarnings: 0,
        readyEarnings: 0,
        awaitingRefundEarnings: 0,
        awaitingCreatorEarnings: 0,
        commissionPercent: null as number | null,
      };

      existing.purchaseCount += 1;
      existing.totalRevenue += purchase.amount;
      existing.totalEarnings += purchase.commissionAmount;
      if (effectiveStatus === "paid") {
        existing.paidEarnings += purchase.commissionAmount;
      } else if (effectiveStatus === "ready_for_payout") {
        existing.readyEarnings += purchase.commissionAmount;
      } else if (effectiveStatus === "awaiting_refund_window") {
        existing.awaitingRefundEarnings += purchase.commissionAmount;
      } else if (effectiveStatus === "pending_creator_payment") {
        existing.awaitingCreatorEarnings += purchase.commissionAmount;
      }

      const contract = contractByProject.get(purchase.projectId);
      if (contract && existing.commissionPercent === null) {
        const percent =
          contract.commissionPercent > 1
            ? Math.round(contract.commissionPercent)
            : Math.round(contract.commissionPercent * 100);
        existing.commissionPercent = percent;
      }

      acc.set(purchase.projectId, existing);
      return acc;
    },
    new Map<
      string,
      {
        projectId: string;
        projectName: string;
        purchaseCount: number;
        totalRevenue: number;
        totalEarnings: number;
        paidEarnings: number;
        readyEarnings: number;
        awaitingRefundEarnings: number;
        awaitingCreatorEarnings: number;
        commissionPercent: number | null;
      }
    >(),
  );

  const projectEarningsList = Array.from(projectEarnings.values()).sort(
    (a, b) => b.totalEarnings - a.totalEarnings,
  );
  const totalAdjustments = adjustments.reduce(
    (sum, adjustment) => sum + adjustment.amount,
    0,
  );
  const netEarnings = totals.totalEarnings + totalAdjustments;
  const netReady = Math.max(0, totals.ready + pendingAdjustmentsTotal);

  const InfoLabel = ({
    label,
    help,
  }: {
    label: string;
    help: string;
  }) => (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
            aria-label={`${label} info`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {help}
        </TooltipContent>
      </Tooltip>
    </span>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">
          Track your commission earnings and payouts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(totals.totalEarnings)}
          description="All time"
          icon={DollarSign}
        />
        <StatCard
          title={
            <InfoLabel
              label="Adjustments"
              help="Outstanding refunds or chargebacks that reduce your next payout."
            />
          }
          value={formatCurrency(pendingAdjustmentsTotal)}
          description="Outstanding balance"
          icon={Clock}
        />
        <StatCard
          title={
            <InfoLabel
              label="Net Earnings"
              help="Total earnings after adjustments."
            />
          }
          value={formatCurrency(netEarnings)}
          description="After adjustments"
          icon={DollarSign}
        />
        <StatCard
          title="Received"
          value={formatCurrency(totals.paid)}
          description="Paid out to you"
          icon={CheckCircle}
        />
        <StatCard
          title={
            <InfoLabel
              label="Ready to receive"
              help="Available for payout after adjustments are applied."
            />
          }
          value={formatCurrency(netReady)}
          description="Creator paid"
          icon={CheckCircle}
        />
        <StatCard
          title={
            <InfoLabel
              label="Refund window"
              help="Commissions held until the refund window ends."
            />
          }
          value={formatCurrency(totals.awaitingRefund)}
          description="Waiting period"
          icon={Timer}
        />
        <StatCard
          title={
            <InfoLabel
              label="Awaiting creator"
              help="Commissions pending creator payment."
            />
          }
          value={formatCurrency(totals.awaitingCreator)}
          description="Creator payment pending"
          icon={Clock}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(totals.totalRevenue)}
          description="Coupon-attributed"
          icon={TrendingUp}
        />
      </div>

      {/* Earnings by Project */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings by Project</CardTitle>
        </CardHeader>
        <CardContent>
          {projectEarningsList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No earnings yet. Start promoting projects to earn commissions.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Ready</TableHead>
                  <TableHead className="text-right">Refund Window</TableHead>
                  <TableHead className="text-right">Awaiting Creator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectEarningsList.map((item) => {
                  return (
                    <TableRow key={item.projectId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.projectName}</p>
                          {item.commissionPercent !== null ? (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {item.commissionPercent}% commission
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.commissionPercent !== null
                          ? `${item.commissionPercent}%`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.purchaseCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalEarnings)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(item.paidEarnings)}
                      </TableCell>
                      <TableCell className="text-right text-sky-400">
                        {formatCurrency(item.readyEarnings)}
                      </TableCell>
                      <TableCell className="text-right text-amber-500">
                        {formatCurrency(item.awaitingRefundEarnings)}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {formatCurrency(item.awaitingCreatorEarnings)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Payout Schedule</p>
              <p className="text-sm text-muted-foreground">
                Earnings are paid out on the 1st of each month for the previous
                month. Minimum payout threshold is $50.
              </p>
            </div>
          </div>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(adjustment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {adjustment.projectName}
                      </TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
