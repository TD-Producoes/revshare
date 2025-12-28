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
import { useCreatorPayouts } from "@/lib/hooks/creator";

export default function PayoutsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data, isLoading: isPayoutsLoading } = useCreatorPayouts(
    currentUser?.id,
  );

  if (isAuthLoading || isUserLoading || isPayoutsLoading) {
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
    platformFee: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
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
          value={formatCurrency(totals.pendingCommissions)}
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
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => {
                  const paid = payout.paidEarnings;
                  const pending = payout.pendingEarnings;

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
                        {formatCurrency(pending)}
                      </TableCell>
                      <TableCell>
                        {pending > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="gap-1 bg-green-600"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Paid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a mock payout system. In a real
            implementation, payouts would be processed through Stripe Connect
            and automated based on your payout schedule settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
