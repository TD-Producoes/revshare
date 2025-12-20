"use client";

import { useCurrentUser, useProjects, useOffers, useEvents } from "@/lib/data/store";
import {
  getCreatorMetrics,
  getProjectMetrics,
  getRevenueTimeline,
  formatCurrency,
} from "@/lib/data/metrics";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { ProjectsTable } from "./projects-table";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";

export function CreatorDashboard() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();

  if (!currentUser || currentUser.role !== "creator") {
    return null;
  }

  const metrics = getCreatorMetrics(events, projects, currentUser.id);
  const creatorProjects = projects.filter((p) => p.creatorId === currentUser.id);
  const revenueData = getRevenueTimeline(events, undefined, undefined, 30);

  // Filter revenue data for creator's projects only
  const creatorProjectIds = creatorProjects.map((p) => p.id);
  const filteredEvents = events.filter((e) =>
    creatorProjectIds.includes(e.projectId)
  );
  const creatorRevenueData = getRevenueTimeline(filteredEvents, undefined, undefined, 30);

  // Get project metrics for table
  const projectsWithMetrics = creatorProjects.map((project) => {
    const projectMetrics = getProjectMetrics(events, project);
    const projectOffers = offers.filter(
      (o) => o.projectId === project.id && o.status === "approved"
    );

    return {
      ...project,
      metrics: projectMetrics,
      marketerCount: projectOffers.length,
    };
  });

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
          value={formatCurrency(metrics.totalRevenue)}
          description="All time"
          icon={DollarSign}
          trend={{ value: 12.5, label: "from last month" }}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          description="Current MRR"
          icon={TrendingUp}
          trend={{ value: 8.2, label: "from last month" }}
        />
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(metrics.affiliateRevenue)}
          description={`${Math.round(
            (metrics.affiliateRevenue / (metrics.totalRevenue || 1)) * 100
          )}% of total`}
          icon={Users}
        />
        <StatCard
          title="Commissions Owed"
          value={formatCurrency(metrics.affiliateShareOwed)}
          description={`Platform fee: ${formatCurrency(metrics.platformFee)}`}
          icon={CreditCard}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={creatorRevenueData}
        title="Revenue (Last 30 Days)"
        showAffiliate={true}
      />

      {/* Projects Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
        <ProjectsTable projects={projectsWithMetrics} />
      </div>
    </div>
  );
}
