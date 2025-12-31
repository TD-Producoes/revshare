"use client";

import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { DollarSign, Users, TrendingUp, CalendarDays } from "lucide-react";

type ProjectSummary = {
  pricingModel: string;
  price: number;
  revSharePercent: number;
  cookieWindowDays: number;
};

type ProjectStats = {
  stripe: {
    totalRevenue: number;
    charges: number;
    newCustomers: number;
  };
  platform: {
    totalTrackedRevenue: number;
    totalCommission: number;
    purchases: number;
  };
  coupons: {
    revenue: number;
    commission: number;
    purchases: number;
  };
};

export function ProjectOverviewTab({
  project,
  metrics,
  currency,
  projectStats,
  isStatsLoading,
  projectStatsError,
  revenueData,
}: {
  project: ProjectSummary;
  metrics: {
    totalRevenue: number;
    mrr: number;
    activeSubscribers: number;
    affiliateRevenue: number;
  };
  currency: string;
  projectStats?: ProjectStats | null;
  isStatsLoading: boolean;
  projectStatsError?: Error | null;
  revenueData: Array<{ date: Date; total: number; affiliate: number }>;
}) {
  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, currency)}
          icon={DollarSign}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr, currency)}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Subscribers"
          value={formatNumber(metrics.activeSubscribers)}
          icon={Users}
        />
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(metrics.affiliateRevenue, currency)}
          description={`${Math.round(
            (metrics.affiliateRevenue / (metrics.totalRevenue || 1)) * 100,
          )}% of total revenue`}
          icon={CalendarDays}
        />
      </div>

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
                  {formatCurrency(projectStats.stripe.totalRevenue, currency)}
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
                  {formatCurrency(
                    projectStats.platform.totalTrackedRevenue,
                    currency,
                  )}
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Commission:{" "}
                    {formatCurrency(
                      projectStats.platform.totalCommission,
                      currency,
                    )}
                  </p>
                  <p>Purchases: {formatNumber(projectStats.platform.purchases)}</p>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Coupon Revenue</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(projectStats.coupons.revenue, currency)}
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Commission:{" "}
                    {formatCurrency(projectStats.coupons.commission, currency)}
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

      <RevenueChart
        data={revenueData}
        title="Revenue (Last 30 Days)"
        showAffiliate={true}
      />
    </div>
  );
}
