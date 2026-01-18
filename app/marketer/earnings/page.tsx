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

  const totalsByCurrency = purchases.reduce((acc, purchase) => {
    const effectiveStatus = getEffectiveCommissionStatus(purchase);
    if (effectiveStatus === "refunded" || effectiveStatus === "chargeback") {
      return acc;
    }
    const currency =
      (purchase.projectCurrency ?? purchase.currency ?? "USD").toUpperCase();
    const existing = acc.get(currency) ?? {
      totalRevenue: 0,
      totalEarnings: 0,
      paid: 0,
      ready: 0,
      awaitingRefund: 0,
      awaitingCreator: 0,
    };
    existing.totalRevenue += purchase.amount;
    existing.totalEarnings += purchase.commissionAmount;
    switch (effectiveStatus) {
      case "paid":
        existing.paid += purchase.commissionAmount;
        break;
      case "ready_for_payout":
        existing.ready += purchase.commissionAmount;
        break;
      case "awaiting_refund_window":
        existing.awaitingRefund += purchase.commissionAmount;
        break;
      case "pending_creator_payment":
        existing.awaitingCreator += purchase.commissionAmount;
        break;
      default:
        break;
    }
    acc.set(currency, existing);
    return acc;
  }, new Map<
    string,
    {
      totalRevenue: number;
      totalEarnings: number;
      paid: number;
      ready: number;
      awaitingRefund: number;
      awaitingCreator: number;
    }
  >());

  const pendingAdjustmentsByCurrency = adjustments.reduce((acc, adjustment) => {
    if (adjustment.status !== "PENDING") {
      return acc;
    }
    const currency = adjustment.currency.toUpperCase();
    acc.set(currency, (acc.get(currency) ?? 0) + adjustment.amount);
    return acc;
  }, new Map<string, number>());

  const formatCurrencyList = (entries: Array<[string, number]>) => {
    if (entries.length === 0) {
      return formatCurrency(0);
    }
    if (entries.length === 1) {
      const [currency, amount] = entries[0];
      return formatCurrency(amount, currency);
    }
    return entries
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(" · ");
  };

  const summarizeTotals = (
    selector: (value: {
      totalRevenue: number;
      totalEarnings: number;
      paid: number;
      ready: number;
      awaitingRefund: number;
      awaitingCreator: number;
    }) => number,
  ) =>
    formatCurrencyList(
      Array.from(totalsByCurrency.entries())
        .map(([currency, value]) => [currency, selector(value)] as [string, number])
        .filter(([, amount]) => amount !== 0),
    );

  const netEarningsByCurrency = Array.from(totalsByCurrency.entries())
    .map(([currency, value]) => [
      currency,
      value.totalEarnings + (pendingAdjustmentsByCurrency.get(currency) ?? 0),
    ] as [string, number])
    .filter(([, amount]) => amount !== 0);

  const netReadyByCurrency = Array.from(totalsByCurrency.entries())
    .map(([currency, value]) => [
      currency,
      Math.max(
        0,
        value.ready + (pendingAdjustmentsByCurrency.get(currency) ?? 0),
      ),
    ] as [string, number])
    .filter(([, amount]) => amount !== 0);

  const pendingAdjustmentsEntries = Array.from(pendingAdjustmentsByCurrency.entries())
    .filter(([, amount]) => amount !== 0);

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
        currency: purchase.projectCurrency ?? purchase.currency,
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

      if (!existing.currency) {
        existing.currency = purchase.projectCurrency ?? purchase.currency;
      }

      acc.set(purchase.projectId, existing);
      return acc;
    },
    new Map<
      string,
      {
        projectId: string;
        projectName: string;
        currency: string | null;
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
  const earningsByCurrency = projectEarningsList.reduce((acc, entry) => {
    const currency = (entry.currency ?? "USD").toUpperCase();
    const list = acc.get(currency) ?? [];
    list.push(entry);
    acc.set(currency, list);
    return acc;
  }, new Map<string, typeof projectEarningsList>());
  const earningsGroups = Array.from(earningsByCurrency.entries())
    .map(([currency, entries]) => ({
      currency,
      entries,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
  const netEarnings = formatCurrencyList(netEarningsByCurrency);
  const netReady = formatCurrencyList(netReadyByCurrency);

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
          value={summarizeTotals((value) => value.totalEarnings)}
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
          value={formatCurrencyList(pendingAdjustmentsEntries)}
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
          value={netEarnings}
          description="After adjustments"
          icon={DollarSign}
        />
        <StatCard
          title="Received"
          value={summarizeTotals((value) => value.paid)}
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
          value={netReady}
          description="Founder paid"
          icon={CheckCircle}
        />
        <StatCard
          title={
            <InfoLabel
              label="Refund window"
              help="Commissions held until the refund window ends."
            />
          }
          value={summarizeTotals((value) => value.awaitingRefund)}
          description="Waiting period"
          icon={Timer}
        />
        <StatCard
          title={
            <InfoLabel
              label="Awaiting founder"
              help="Commissions pending founder payment."
            />
          }
          value={summarizeTotals((value) => value.awaitingCreator)}
          description="Founder payment pending"
          icon={Clock}
        />
        <StatCard
          title="Revenue"
          value={summarizeTotals((value) => value.totalRevenue)}
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
            <div className="space-y-6">
              {earningsGroups.map((group) => (
                <div key={group.currency} className="space-y-3">
                  {earningsGroups.length > 1 ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {group.currency.toUpperCase()} projects
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {group.entries.length} projects
                      </Badge>
                    </div>
                  ) : null}
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
                        <TableHead className="text-right">Awaiting Founder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.entries.map((item) => {
                        return (
                          <TableRow key={`${group.currency}-${item.projectId}`}>
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
                              {formatCurrency(item.totalRevenue, group.currency)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.totalEarnings, group.currency)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(item.paidEarnings, group.currency)}
                            </TableCell>
                            <TableCell className="text-right text-sky-400">
                              {formatCurrency(item.readyEarnings, group.currency)}
                            </TableCell>
                            <TableCell className="text-right text-amber-500">
                              {formatCurrency(item.awaitingRefundEarnings, group.currency)}
                            </TableCell>
                            <TableCell className="text-right text-yellow-600">
                              {formatCurrency(item.awaitingCreatorEarnings, group.currency)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
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
