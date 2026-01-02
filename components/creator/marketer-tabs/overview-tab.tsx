"use client";

import Link from "next/link";

import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { BadgePercent, Coins, DollarSign, Users } from "lucide-react";

type OverviewSummary = {
  projectRevenue: number;
  affiliateRevenue: number;
  commissionOwed: number;
  purchasesCount: number;
  customersCount: number;
};

export function MarketerOverviewTab({
  summary,
  currency,
  projects,
}: {
  summary: OverviewSummary;
  currency: string;
  projects: Array<{ id: string; name: string }>;
}) {
  const affiliateShare =
    summary.projectRevenue > 0
      ? Math.round((summary.affiliateRevenue / summary.projectRevenue) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(summary.affiliateRevenue, currency)}
          description={`${affiliateShare}% of project revenue`}
          icon={DollarSign}
        />
        <StatCard
          title="Commission Owed"
          value={formatCurrency(summary.commissionOwed, currency)}
          icon={Coins}
        />
        <StatCard
          title="Project Revenue"
          value={formatCurrency(summary.projectRevenue, currency)}
          icon={BadgePercent}
        />
        <StatCard
          title="Purchases"
          value={formatNumber(summary.purchasesCount)}
          icon={BadgePercent}
        />
        <StatCard
          title="Customers"
          value={formatNumber(summary.customersCount)}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active projects yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/creator/projects/${project.id}`}
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Active
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
