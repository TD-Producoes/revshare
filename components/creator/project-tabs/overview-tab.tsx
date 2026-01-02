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

export function ProjectOverviewTab({
  project,
  metrics,
  currency,
  revenueData,
}: {
  project: ProjectSummary;
  metrics: {
    totalRevenue: number;
    mrr: number;
    activeSubscribers: number;
    affiliateRevenue: number;
    affiliateMrr?: number;
    affiliateSubscribers?: number;
    customers?: number;
    affiliateCustomers?: number;
  };
  currency: string;
  revenueData: Array<{
    date: string;
    revenue: number;
    affiliateRevenue: number;
  }>;
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
              <p className="text-sm text-muted-foreground">Refund Window</p>
              <p className="font-medium">{project.cookieWindowDays} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          title="Affiliate Revenue"
          value={formatCurrency(metrics.affiliateRevenue, currency)}
          description={`${Math.round(
            (metrics.affiliateRevenue / (metrics.totalRevenue || 1)) * 100,
          )}% of total revenue`}
          icon={CalendarDays}
        />
        <StatCard
          title="Affiliate MRR"
          value={formatCurrency(metrics.affiliateMrr ?? 0, currency)}
          icon={TrendingUp}
        />
        <StatCard
          title="Customers"
          value={formatNumber(metrics.customers ?? 0)}
          icon={Users}
        />
        <StatCard
          title="Affiliate Customers"
          value={formatNumber(metrics.affiliateCustomers ?? 0)}
          description={`${Math.round(
            ((metrics.affiliateCustomers ?? 0) / ((metrics.customers ?? 0) || 1)) *
              100,
          )}% of total customers`}
          icon={CalendarDays}
        />
      </div>

      <RevenueChart
        data={revenueData}
        title="Revenue (Last 30 Days)"
        showAffiliate={true}
      />
    </div>
  );
}
