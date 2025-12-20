"use client";

import { useProjects, useOffers, useEvents, useUsers } from "@/lib/data/store";
import {
  getProjectMetrics,
  getProjectMarketerMetrics,
  getRevenueTimeline,
  formatCurrency,
  formatPercent,
  formatNumber,
} from "@/lib/data/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { StatCard } from "@/components/shared/stat-card";
import { DollarSign, Users, TrendingUp, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();
  const users = useUsers();

  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" asChild>
          <Link href="/creator/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const metrics = getProjectMetrics(events, project);
  const marketerMetrics = getProjectMarketerMetrics(events, project, offers);
  const revenueData = getRevenueTimeline(events, project.id, undefined, 30);

  // Get marketer details
  const marketersWithMetrics = marketerMetrics.map((mm) => {
    const marketer = users.find((u) => u.id === mm.marketerId);
    const offer = offers.find(
      (o) => o.projectId === project.id && o.marketerId === mm.marketerId
    );
    return {
      marketer,
      offer,
      metrics: mm.metrics,
    };
  });

  // Calculate commission owed per marketer
  const getCommissionOwed = (earnings: number) => {
    return earnings; // Already calculated with rev share
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/creator/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="secondary">{project.category}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{project.description}</p>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Share Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Pricing Model</p>
              <p className="font-medium capitalize">{project.pricingModel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">
                {formatCurrency(project.price)}
                {project.pricingModel === "subscription" && "/mo"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue Share</p>
              <p className="font-medium">{project.revSharePercent}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cookie Window</p>
              <p className="font-medium">{project.cookieWindowDays} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Subscribers"
          value={formatNumber(metrics.activeSubscribers)}
          icon={Users}
        />
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(metrics.affiliateRevenue)}
          description={`${Math.round(
            (metrics.affiliateRevenue / (metrics.totalRevenue || 1)) * 100
          )}% of total revenue`}
          icon={CalendarDays}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={revenueData}
        title="Revenue (Last 30 Days)"
        showAffiliate={true}
      />

      {/* Marketers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affiliate Marketers</CardTitle>
        </CardHeader>
        <CardContent>
          {marketersWithMetrics.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No marketers are promoting this project yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketer</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Paid Customers</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead className="text-right">MRR Attributed</TableHead>
                  <TableHead className="text-right">Commission Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketersWithMetrics.map(({ marketer, offer, metrics }) => (
                  <TableRow key={marketer?.id || offer?.id}>
                    <TableCell className="font-medium">
                      {marketer?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {offer?.referralCode}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(metrics.clicks)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(metrics.signups)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(metrics.paidCustomers)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(metrics.conversionRate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(metrics.mrr)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(getCommissionOwed(metrics.earnings))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
