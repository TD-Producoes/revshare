"use client";

import { useCurrentUser, useProjects, useOffers, useEvents, useUsers } from "@/lib/data/store";
import {
  getCreatorMetrics,
  getProjectMarketerMetrics,
  formatCurrency,
} from "@/lib/data/metrics";
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

export default function PayoutsPage() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();
  const users = useUsers();

  if (!currentUser || currentUser.role !== "creator") {
    return null;
  }

  const metrics = getCreatorMetrics(events, projects, currentUser.id);
  const creatorProjects = projects.filter((p) => p.userId === currentUser.id);

  // Calculate payouts per marketer
  const marketerPayouts: Array<{
    marketerId: string;
    marketerName: string;
    totalEarnings: number;
    projectCount: number;
  }> = [];

  const marketerMap = new Map<
    string,
    { totalEarnings: number; projectCount: number }
  >();

  creatorProjects.forEach((project) => {
    const projectMarketerMetrics = getProjectMarketerMetrics(events, project, offers);
    projectMarketerMetrics.forEach(({ marketerId, metrics: m }) => {
      const existing = marketerMap.get(marketerId) || {
        totalEarnings: 0,
        projectCount: 0,
      };
      marketerMap.set(marketerId, {
        totalEarnings: existing.totalEarnings + m.earnings,
        projectCount: existing.projectCount + 1,
      });
    });
  });

  marketerMap.forEach((data, marketerId) => {
    const marketer = users.find((u) => u.id === marketerId);
    marketerPayouts.push({
      marketerId,
      marketerName: marketer?.name || "Unknown",
      totalEarnings: data.totalEarnings,
      projectCount: data.projectCount,
    });
  });

  // Sort by earnings descending
  marketerPayouts.sort((a, b) => b.totalEarnings - a.totalEarnings);

  // Simulate paid vs pending (70% paid, 30% pending)
  const paidCommissions = Math.floor(metrics.affiliateShareOwed * 0.7);
  const pendingCommissions = metrics.affiliateShareOwed - paidCommissions;

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
          value={formatCurrency(metrics.affiliateShareOwed)}
          description="All time"
          icon={DollarSign}
        />
        <StatCard
          title="Paid Out"
          value={formatCurrency(paidCommissions)}
          description="Successfully paid"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(pendingCommissions)}
          description="Awaiting payout"
          icon={Clock}
        />
        <StatCard
          title="Platform Fee"
          value={formatCurrency(metrics.platformFee)}
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
          {marketerPayouts.length === 0 ? (
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
                {marketerPayouts.map((payout) => {
                  const paid = Math.floor(payout.totalEarnings * 0.7);
                  const pending = payout.totalEarnings - paid;

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
