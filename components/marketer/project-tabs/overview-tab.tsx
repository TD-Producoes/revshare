import { BadgePercent, Coins, DollarSign, ShoppingCart, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";

type MetricsSummary = {
  affiliateRevenue: number;
  commissionOwed: number;
  projectRevenue: number;
  purchasesCount: number;
  customersCount: number;
};

type AdjustmentRow = {
  id: string;
  createdAt: string | Date;
  reason: string;
  amount: number;
  currency: string;
  status: string;
};

export function MarketerProjectOverviewTab({
  attributionUrl,
  attributionErrorMessage,
  hasStoreUrls,
  onCopyLink,
  metricsSummary,
  affiliateShare,
  projectCurrency,
  projectAdjustments,
}: {
  attributionUrl: string;
  attributionErrorMessage: string | null;
  hasStoreUrls: boolean;
  onCopyLink: (value: string) => void;
  metricsSummary: MetricsSummary;
  affiliateShare: number;
  projectCurrency: string;
  projectAdjustments: AdjustmentRow[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attribution link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Share this link to send users to the app store and attribute installs to
            your marketer ID.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input value={attributionUrl} readOnly placeholder="Generating link..." />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="sm:self-stretch"
              onClick={() => onCopyLink(attributionUrl)}
              disabled={!attributionUrl}
            >
              Copy link
            </Button>
          </div>
          {attributionErrorMessage && (
            <p className="text-xs text-destructive">{attributionErrorMessage}</p>
          )}
          {!hasStoreUrls && (
            <p className="text-xs text-amber-600">
              Ask the founder to add the App Store and Play Store URLs so this link
              can redirect users after tracking.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(metricsSummary.affiliateRevenue, projectCurrency)}
          description={`${affiliateShare}% of project revenue`}
          icon={DollarSign}
        />
        <StatCard
          title="Commission Owed"
          value={formatCurrency(metricsSummary.commissionOwed, projectCurrency)}
          icon={Coins}
        />
        <StatCard
          title="Project Revenue"
          value={formatCurrency(metricsSummary.projectRevenue, projectCurrency)}
          icon={BadgePercent}
        />
        <StatCard
          title="Purchases"
          value={formatNumber(metricsSummary.purchasesCount)}
          icon={ShoppingCart}
        />
        <StatCard
          title="Customers"
          value={formatNumber(metricsSummary.customersCount)}
          icon={Users}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold">Commission Adjustments</h3>
        {projectAdjustments.length === 0 ? (
          <p className="text-muted-foreground text-xs">No adjustments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectAdjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(adjustment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {adjustment.reason.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(adjustment.amount, adjustment.currency)}
                  </TableCell>
                  <TableCell className="capitalize">
                    <Badge variant="outline">
                      {adjustment.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
