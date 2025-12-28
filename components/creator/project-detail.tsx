"use client";

import { useState } from "react";
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
import { Project } from "@/lib/data/types";
import { useProject, useProjectStats } from "@/lib/hooks/projects";

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();
  const users = useUsers();
  const [connectError, setConnectError] = useState("");

  const { data: apiProject, isLoading } = useProject(projectId);
  const {
    data: projectStats,
    isLoading: isStatsLoading,
    error: projectStatsError,
  } = useProjectStats(projectId);
  const isStripeConnected = Boolean(apiProject?.creatorStripeAccountId);

  const project = projects.find((p) => p.id === projectId);
  const resolvedProject: Project | null =
    project ??
    (apiProject
      ? {
          id: apiProject.id,
          userId: apiProject.userId,
          name: apiProject.name,
          description: apiProject.description ?? "",
          category: "Other",
          pricingModel: "subscription",
          price: 0,
          publicMetrics: {
            mrr: 0,
            activeSubscribers: 0,
          },
          revSharePercent:
            typeof apiProject.marketerCommissionPercent === "string" ||
            typeof apiProject.marketerCommissionPercent === "number"
              ? Number(apiProject.marketerCommissionPercent) > 1
                ? Math.round(Number(apiProject.marketerCommissionPercent))
                : Math.round(Number(apiProject.marketerCommissionPercent) * 100)
              : 0,
          cookieWindowDays: 0,
          createdAt: apiProject.createdAt
            ? new Date(apiProject.createdAt)
            : new Date(),
        }
      : null);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!resolvedProject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" asChild>
          <Link href="/creator/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const metrics = getProjectMetrics(events, resolvedProject);
  const marketerMetrics = getProjectMarketerMetrics(
    events,
    resolvedProject,
    offers
  );
  const revenueData = getRevenueTimeline(
    events,
    resolvedProject.id,
    undefined,
    30
  );

  // Get marketer details
  const marketersWithMetrics = marketerMetrics.map((mm) => {
    const marketer = users.find((u) => u.id === mm.marketerId);
    const offer = offers.find(
      (o) => o.projectId === resolvedProject.id && o.marketerId === mm.marketerId
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

  const handleConnectStripe = async () => {
    setConnectError("");
    try {
      const response = await fetch(
        `/api/connect/oauth/authorize?projectId=${projectId}`
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to start Stripe connect.");
      }
      const payload = await response.json();
      const url = payload?.data?.url;
      if (!url) {
        throw new Error("Stripe redirect URL missing.");
      }
      window.location.href = url;
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Unable to start Stripe connect."
      );
    }
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
            <h1 className="text-2xl font-bold">{resolvedProject.name}</h1>
            <Badge variant="secondary">{resolvedProject.category}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {resolvedProject.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 self-end">
          {isStripeConnected ? (
            <Badge className="self-end" variant="secondary">Stripe connected</Badge>
          ):(
            <Button
              onClick={handleConnectStripe}
              disabled={isStripeConnected}
            >
              Connect Stripe
            </Button>
          )}
          {connectError && (
            <p className="text-sm text-destructive">{connectError}</p>
          )}
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
              <p className="font-medium capitalize">
                {resolvedProject.pricingModel}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">
                {formatCurrency(resolvedProject.price)}
                {resolvedProject.pricingModel === "subscription" && "/mo"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue Share</p>
              <p className="font-medium">{resolvedProject.revSharePercent}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cookie Window</p>
              <p className="font-medium">
                {resolvedProject.cookieWindowDays} days
              </p>
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

      {/* Stripe + Platform Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Stripe & Platform Stats</CardTitle>
        </CardHeader>
        <CardContent>
          {isStatsLoading ? (
            <p className="text-muted-foreground">Loading live stats...</p>
          ) : projectStats ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Stripe Revenue</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(projectStats.stripe.totalRevenue)}
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Charges: {formatNumber(projectStats.stripe.charges)}</p>
                  <p>
                    New Customers: {formatNumber(projectStats.stripe.newCustomers)}
                  </p>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(projectStats.platform.totalTrackedRevenue)}
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Commission: {formatCurrency(projectStats.platform.totalCommission)}
                  </p>
                  <p>Purchases: {formatNumber(projectStats.platform.purchases)}</p>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Coupon Revenue</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(projectStats.coupons.revenue)}
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Commission: {formatCurrency(projectStats.coupons.commission)}
                  </p>
                  <p>Purchases: {formatNumber(projectStats.coupons.purchases)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {projectStatsError instanceof Error
                ? projectStatsError.message
                : "Connect Stripe to view live stats."}
            </p>
          )}
        </CardContent>
      </Card>

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
