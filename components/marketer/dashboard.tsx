"use client";

import {
  useCurrentUser,
  useProjects,
  useOffers,
  useEvents,
} from "@/lib/data/store";
import {
  getMarketerTotalMetrics,
  formatCurrency,
  formatNumber,
} from "@/lib/data/metrics";
import { StatCard } from "@/components/shared/stat-card";
import { MyOffersTable } from "./my-offers-table";
import { MousePointerClick, Users, TrendingUp, DollarSign } from "lucide-react";

export function MarketerDashboard() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();

  if (!currentUser || currentUser.role !== "marketer") {
    return null;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.name}. Here&apos;s your affiliate performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clicks"
          value={formatNumber(metrics.totalClicks)}
          description="All time"
          icon={MousePointerClick}
          trend={{ value: 15.3, label: "from last month" }}
        />
        <StatCard
          title="Conversions"
          value={formatNumber(metrics.totalConversions)}
          description="Paying customers"
          icon={Users}
          trend={{ value: 8.7, label: "from last month" }}
        />
        <StatCard
          title="MRR Attributed"
          value={formatCurrency(metrics.totalMrr)}
          description="Monthly recurring revenue"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Earnings"
          value={formatCurrency(metrics.totalEarnings)}
          description={`Upcoming: ${formatCurrency(metrics.upcomingEarnings)}`}
          icon={DollarSign}
        />
      </div>

      {/* Active Offers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Active Offers</h2>
        <MyOffersTable offers={approvedOffers} limit={5} />
      </div>
    </div>
  );
}
