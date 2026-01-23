"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useMarketerTransfers } from "@/lib/hooks/marketer";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarDays,
  ListChecks,
  BarChart3,
  Check,
} from "lucide-react";

const statusBadge = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "paid") {
    return (
      <Badge variant="success">
        <Check className="size-3 text-emerald-600" />
        Paid
      </Badge>
    );
  }
  if (normalized === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
};

export function MarketerPayouts() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: transfersPayload, isLoading: isTransfersLoading } =
    useMarketerTransfers(currentUser?.id);

  if (isAuthLoading || isUserLoading || isTransfersLoading) {
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

  const transfers = transfersPayload?.transfers ?? [];
  const totalsByCurrency = transfers.reduce(
    (acc, transfer) => {
      const currency = transfer.currency?.toUpperCase() ?? "USD";
      const existing = acc.get(currency) ?? {
        paid: 0,
        pending: 0,
        failed: 0,
        paidCount: 0,
      };
      if (transfer.status === "PAID") {
        existing.paid += transfer.amount;
        existing.paidCount += 1;
      } else if (transfer.status === "PENDING") {
        existing.pending += transfer.amount;
      } else if (transfer.status === "FAILED") {
        existing.failed += transfer.amount;
      }
      acc.set(currency, existing);
      return acc;
    },
    new Map<
      string,
      { paid: number; pending: number; failed: number; paidCount: number }
    >(),
  );
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
  const paidTotals = Array.from(totalsByCurrency.entries()).map(
    ([currency, totals]) => [currency, totals.paid] as [string, number],
  );
  const pendingTotals = Array.from(totalsByCurrency.entries()).map(
    ([currency, totals]) => [currency, totals.pending] as [string, number],
  );
  const failedTotals = Array.from(totalsByCurrency.entries()).map(
    ([currency, totals]) => [currency, totals.failed] as [string, number],
  );
  const averagePaidTotals = Array.from(totalsByCurrency.entries())
    .map(([currency, totals]) => {
      const average =
        totals.paidCount > 0 ? Math.round(totals.paid / totals.paidCount) : 0;
      return [currency, average] as [string, number];
    })
    .filter(([, amount]) => amount > 0);
  const paidTransfers = transfers.filter(
    (transfer) => transfer.status.toLowerCase() === "paid",
  );
  const lastPaidTransfer = paidTransfers.reduce<{
    createdAt: string | Date;
  } | null>((latest, transfer) => {
    if (!latest) return transfer;
    return new Date(transfer.createdAt) > new Date(latest.createdAt)
      ? transfer
      : latest;
  }, null);
  const averagePaidAmount = formatCurrencyList(averagePaidTotals);
  const paidTotalLabel = formatCurrencyList(paidTotals);
  const pendingTotalLabel = formatCurrencyList(pendingTotals);
  const failedTotalLabel = formatCurrencyList(failedTotals);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">
          Review transfers sent to your Stripe account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Paid out"
          value={paidTotalLabel}
          description="Transfers completed"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={pendingTotalLabel}
          description="In progress"
          icon={Clock}
        />
        <StatCard
          title="Failed"
          value={failedTotalLabel}
          description="Requires attention"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total transfers"
          value={formatNumber(transfers.length)}
          description="All time"
          icon={ListChecks}
        />
        <StatCard
          title="Last payout"
          value={
            lastPaidTransfer
              ? new Date(lastPaidTransfer.createdAt).toLocaleDateString()
              : "—"
          }
          description="Most recent paid transfer"
          icon={CalendarDays}
        />
        <StatCard
          title="Average payout"
          value={averagePaidAmount}
          description="Per paid transfer"
          icon={BarChart3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-muted-foreground">
              No transfers yet. Once payouts are processed, they will appear here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const transferCurrency = transfer.currency ?? "USD";
                  const reference = transfer.stripeTransferId ?? "-";
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {transfer.type === "reward" ? "Reward payout" : "Commission"}
                      </TableCell>
                      <TableCell>
                        {transfer.projects.length > 0
                          ? transfer.projects.join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(transfer.amount, transferCurrency)}
                      </TableCell>
                      <TableCell className="space-y-1">
                        {statusBadge(transfer.status)}
                        {transfer.status.toLowerCase() === "failed" &&
                        transfer.failureReason ? (
                          <p className="text-xs text-muted-foreground">
                            {transfer.failureReason}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reference}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
