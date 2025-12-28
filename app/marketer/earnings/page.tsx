"use client";

import { useProjects, useOffers, useEvents } from "@/lib/data/store";
import {
  getMarketerProjectMetrics,
  getMarketerTotalMetrics,
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
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";

export default function EarningsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();

  if (isAuthLoading || isUserLoading) {
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

  const metrics = getMarketerTotalMetrics(
    events,
    projects,
    offers,
    currentUser.id
  );

  const approvedOffers = offers.filter(
    (o) => o.marketerId === currentUser.id && o.status === "approved"
  );

  // Calculate earnings per project
  const projectEarnings = approvedOffers.map((offer) => {
    const project = projects.find((p) => p.id === offer.projectId);
    if (!project) return null;

    const projectMetrics = getMarketerProjectMetrics(
      events,
      project,
      currentUser.id
    );

    return {
      project,
      offer,
      metrics: projectMetrics,
    };
  }).filter(Boolean);

  // Simulate paid vs pending (70% paid, 30% pending)
  const paidEarnings = Math.floor(metrics.totalEarnings * 0.7);
  const pendingEarnings = metrics.totalEarnings - paidEarnings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">
          Track your commission earnings and payouts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(metrics.totalEarnings)}
          description="All time"
          icon={DollarSign}
        />
        <StatCard
          title="Received"
          value={formatCurrency(paidEarnings)}
          description="Successfully paid"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(pendingEarnings)}
          description="Awaiting payout"
          icon={Clock}
        />
        <StatCard
          title="Upcoming"
          value={formatCurrency(metrics.upcomingEarnings)}
          description="Estimated this month"
          icon={TrendingUp}
        />
      </div>

      {/* Earnings by Project */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings by Project</CardTitle>
        </CardHeader>
        <CardContent>
          {projectEarnings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No earnings yet. Start promoting projects to earn commissions.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Rev Share</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">MRR Attributed</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectEarnings.map((item) => {
                  if (!item) return null;
                  const { project, metrics: m } = item;
                  const paid = Math.floor(m.earnings * 0.7);
                  const pending = m.earnings - paid;

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {project.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {project.revSharePercent}%
                      </TableCell>
                      <TableCell className="text-right">
                        {m.paidCustomers}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(m.mrr)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(m.earnings)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(paid)}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {formatCurrency(pending)}
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
    </div>
  );
}
