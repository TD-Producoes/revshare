"use client";

import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { StatCard } from "@/components/shared/stat-card";
import { MyOffersTable } from "./my-offers-table";
import {
  DollarSign,
  AlertCircle,
  ShoppingCart,
  Users,
  BadgePercent,
} from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useContractsForMarketer } from "@/lib/hooks/contracts";
import { useMarketerPurchases, useMarketerMetrics } from "@/lib/hooks/marketer";
import { PurchasesTable } from "./purchases-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketerDashboard() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);
  const { data: purchases = [], isLoading: isPurchasesLoading } =
    useMarketerPurchases(currentUser?.id);
  const { data: metrics, isLoading: isMetricsLoading } =
    useMarketerMetrics(currentUser?.id);

  if (
    isAuthLoading ||
    isUserLoading ||
    isContractsLoading ||
    isPurchasesLoading ||
    isMetricsLoading
  ) {
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

  const totalRevenue = metrics?.summary.affiliateRevenue ?? 0;
  const totalEarnings = metrics?.summary.commissionOwed ?? 0;
  const totalPurchases = metrics?.summary.purchasesCount ?? 0;
  const totalCustomers = metrics?.summary.customersCount ?? 0;
  const projectRevenue = metrics?.summary.projectRevenue ?? 0;
  const affiliateShare =
    projectRevenue > 0
      ? Math.round((totalRevenue / projectRevenue) * 100)
      : 0;
  const approvedContracts = contracts.filter((c) => c.status === "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.name}. Here&apos;s your affiliate performance.
        </p>
      </div>

      {!currentUser.stripeConnectedAccountId && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="h-4 w-4" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <AlertTitle>Connect Stripe to receive payouts</AlertTitle>
              <AlertDescription>
                You can keep using the platform, but funds will be transferred only after
                you connect Stripe.
              </AlertDescription>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/marketer/settings">Go to settings</Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(totalRevenue)}
          description={`${affiliateShare}% of project revenue`}
          icon={DollarSign}
        />
        <StatCard
          title="Commission Owed"
          value={formatCurrency(totalEarnings)}
          description="Awaiting payout"
          icon={BadgePercent}
        />
        <StatCard
          title="Purchases"
          value={formatNumber(totalPurchases)}
          description="Affiliate-attributed"
          icon={ShoppingCart}
        />
        <StatCard
          title="Customers"
          value={formatNumber(totalCustomers)}
          description="Affiliate-attributed"
          icon={Users}
        />
      </div>

      {/* Active Offers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Active Offers</h2>
        <MyOffersTable userId={currentUser.id} contracts={approvedContracts} limit={5} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Purchases</h2>
        <PurchasesTable purchases={purchases} limit={5} />
      </div>
    </div>
  );
}
