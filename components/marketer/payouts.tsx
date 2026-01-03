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
} from "lucide-react";

const statusBadge = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "paid") {
    return <Badge className="bg-emerald-500 text-white">Paid</Badge>;
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

  const totals = transfersPayload?.totals ?? { paid: 0, pending: 0, failed: 0 };
  const currency = transfersPayload?.currency ?? "USD";
  const transfers = transfersPayload?.transfers ?? [];
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
  const averagePaidAmount =
    paidTransfers.length > 0
      ? Math.round(totals.paid / paidTransfers.length)
      : 0;

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
          value={formatCurrency(totals.paid, currency)}
          description="Transfers completed"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(totals.pending, currency)}
          description="In progress"
          icon={Clock}
        />
        <StatCard
          title="Failed"
          value={formatCurrency(totals.failed, currency)}
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
          value={formatCurrency(averagePaidAmount, currency)}
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
                  <TableHead>Projects</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const transferCurrency = transfer.currency ?? currency;
                  const reference = transfer.stripeTransferId ?? "-";
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        {new Date(transfer.createdAt).toLocaleDateString()}
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
