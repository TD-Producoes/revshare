"use client";

import { formatCurrency } from "@/lib/data/metrics";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { ProjectsTable } from "./projects-table";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useCreatorDashboard } from "@/lib/hooks/creator";

export function CreatorDashboard() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data, isLoading: isDashboardLoading } = useCreatorDashboard(
    currentUser?.id,
  );

  if (isAuthLoading || isUserLoading || isDashboardLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "founder") {
    return (
      <div className="text-muted-foreground">
        This section is only available to founders.
      </div>
    );
  }

  const totals = data?.totals ?? {
    totalRevenue: 0,
    mrr: 0,
    affiliateRevenue: 0,
    affiliateShareOwed: 0,
    platformFee: 0,
  };
  const creatorRevenueData = data?.chart ?? [];
  const trends = data?.trends ?? {};

  const projectsWithMetrics =
    data?.projects?.map((project) => {
      const rawCommission = project.marketerCommissionPercent;
      const commissionPercent =
        typeof rawCommission === "string" || typeof rawCommission === "number"
          ? Number(rawCommission) > 1
            ? Math.round(Number(rawCommission))
            : Math.round(Number(rawCommission) * 100)
          : null;

      return {
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        userId: project.userId,
        revSharePercent: commissionPercent ?? undefined,
        metrics: project.metrics,
        marketerCount: project.marketerCount,
      };
    }) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.name}. Here&apos;s your revenue overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totals.totalRevenue)}
          description="All time"
          icon={DollarSign}
          trend={
            typeof trends.totalRevenue === "number"
              ? { value: trends.totalRevenue, label: "from last month" }
              : undefined
          }
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(totals.mrr)}
          description="Current MRR"
          icon={TrendingUp}
          trend={
            typeof trends.mrr === "number"
              ? { value: trends.mrr, label: "from last month" }
              : undefined
          }
        />
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(totals.affiliateRevenue)}
          description={`${Math.round(
            (totals.affiliateRevenue / (totals.totalRevenue || 1)) * 100
          )}% of total`}
          icon={Users}
        />
        <StatCard
          title="Commissions Owed"
          value={formatCurrency(totals.affiliateShareOwed)}
          description={`Platform fee: ${formatCurrency(totals.platformFee)}`}
          icon={CreditCard}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={creatorRevenueData}
        title="Revenue (Last 30 Days)"
        showAffiliate={true}
        currency="USD"
      />

      {/* Projects Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
        <ProjectsTable projects={projectsWithMetrics} />
      </div>
    </div>
  );
}
