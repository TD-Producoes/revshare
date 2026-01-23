"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  BadgePercent,
  ChartLine,
  Check,
  ChevronsUpDown,
  Coins,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type MetricsSummary = {
  totalRevenue: number;
  affiliateRevenue: number;
  affiliateShareOwed?: number;
  platformFee?: number;
  mrr: number;
  affiliateMrr?: number;
  customers?: number;
  affiliateCustomers?: number;
  affiliatePurchases?: number;
  clicks?: number;
  clicks30d?: number;
};

type MetricsTimeline = Array<{
  date: string;
  purchasesCount?: number;
  affiliatePurchasesCount?: number;
  directPurchasesCount?: number;
  uniqueCustomers?: number;
  affiliateCustomers?: number;
  totalRevenue: number;
  affiliateRevenue: number;
}>;

type AffiliateRow = {
  marketerId: string;
  marketerName: string;
  referralCode: string;
  purchases: number;
  revenue: number;
  commission: number;
  clicks: number;
};

function sumField(data: MetricsTimeline, key: keyof MetricsTimeline[number]) {
  return data.reduce((acc, entry) => {
    const value = typeof entry[key] === "number" ? Number(entry[key]) : 0;
    return acc + value;
  }, 0);
}

function MetricAreaChart({
  title,
  data,
  config,
  valueFormatter,
}: {
  title: string;
  data: Array<Record<string, number | string>>;
  config: ChartConfig;
  valueFormatter: (value: number) => string;
}) {
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: new Date(String(item.date)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const [firstKey, secondKey] = Object.keys(config);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => valueFormatter(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => valueFormatter(Number(value))}
                />
              }
            />
            <Area
              type="monotone"
              dataKey={firstKey}
              stroke={`var(--color-${firstKey})`}
              fill={`var(--color-${firstKey})`}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            {secondKey ? (
              <Area
                type="monotone"
                dataKey={secondKey}
                stroke={`var(--color-${secondKey})`}
                fill={`var(--color-${secondKey})`}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ) : null}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ProjectMetricsTab({
  metrics,
  timeline,
  currency,
  affiliateRows,
}: {
  metrics: MetricsSummary;
  timeline: MetricsTimeline;
  currency: string;
  affiliateRows: AffiliateRow[];
}) {
  const [marketerFilterOpen, setMarketerFilterOpen] = useState(false);
  const [selectedMarketerId, setSelectedMarketerId] = useState<string | null>(
    null,
  );

  const marketerOptions = useMemo(
    () =>
      affiliateRows
        .map((row) => ({
          id: row.marketerId,
          label: row.marketerName,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [affiliateRows],
  );

  const filteredRows = useMemo(
    () =>
      selectedMarketerId
        ? affiliateRows.filter((row) => row.marketerId === selectedMarketerId)
        : affiliateRows,
    [affiliateRows, selectedMarketerId],
  );

  const selectedMarketerLabel =
    marketerOptions.find((marketer) => marketer.id === selectedMarketerId)
      ?.label ?? "All marketers";

  const totalCustomers = metrics.customers ?? 0;
  const affiliateCustomers = metrics.affiliateCustomers ?? 0;
  const affiliateShare =
    metrics.totalRevenue > 0
      ? Math.round((metrics.affiliateRevenue / metrics.totalRevenue) * 100)
      : 0;
  const affiliateCustomerShare =
    totalCustomers > 0
      ? Math.round((affiliateCustomers / totalCustomers) * 100)
      : 0;

  const affiliatePurchases30d = sumField(timeline, "affiliatePurchasesCount");
  const affiliateCustomers30d = sumField(timeline, "affiliateCustomers");

  const purchaseChartData = timeline.map((entry) => ({
    date: entry.date,
    purchases: entry.purchasesCount ?? 0,
    affiliatePurchases: entry.affiliatePurchasesCount ?? 0,
  }));

  const customerChartData = timeline.map((entry) => ({
    date: entry.date,
    customers: entry.uniqueCustomers ?? 0,
    affiliateCustomers: entry.affiliateCustomers ?? 0,
  }));

  const purchaseConfig = {
    purchases: {
      label: "Total Purchases",
      color: "hsl(var(--chart-1))",
    },
    affiliatePurchases: {
      label: "Affiliate Purchases",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const customerConfig = {
    customers: {
      label: "Total Customers",
      color: "hsl(var(--chart-3))",
    },
    affiliateCustomers: {
      label: "Affiliate Customers",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Affiliate Share"
          value={`${affiliateShare}%`}
          description="Share of total revenue"
          icon={BadgePercent}
        />
        <StatCard
          title="Affiliate Purchases"
          value={formatNumber(metrics.affiliatePurchases ?? 0)}
          description={`Last 30 days: ${formatNumber(affiliatePurchases30d)}`}
          icon={ChartLine}
        />
        <StatCard
          title="Affiliate Customers"
          value={formatNumber(affiliateCustomers)}
          description={`${affiliateCustomerShare}% of total customers`}
          icon={Users}
        />
        <StatCard
          title="Commissions Owed"
          value={formatCurrency(metrics.affiliateShareOwed ?? 0, currency)}
          description={`Platform fee: ${formatCurrency(
            metrics.platformFee ?? 0,
            currency,
          )}`}
          icon={Coins}
        />
        <StatCard
          title="Clicks"
          value={formatNumber(metrics.clicks ?? 0)}
          description={`Last 30 days: ${formatNumber(metrics.clicks30d ?? 0)}`}
          icon={ChartLine}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart
          data={timeline.map((entry) => ({
            date: entry.date,
            revenue: entry.totalRevenue / 100,
            affiliateRevenue: entry.affiliateRevenue / 100,
          }))}
          title="Revenue (Last 30 Days)"
          showAffiliate={true}
          currency={currency}
        />
        <MetricAreaChart
          title="Purchases (Last 30 Days)"
          data={purchaseChartData}
          config={purchaseConfig}
          valueFormatter={(value) => formatNumber(value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricAreaChart
          title="Customers (Last 30 Days)"
          data={customerChartData}
          config={customerConfig}
          valueFormatter={(value) => formatNumber(value)}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Affiliate Customers (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">
              {formatNumber(affiliateCustomers30d)}
            </p>
            <p className="text-sm text-muted-foreground">
              Out of {formatNumber(sumField(timeline, "uniqueCustomers"))} total
              customers in the last 30 days.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold">Marketer Performance</h3>
          <Popover open={marketerFilterOpen} onOpenChange={setMarketerFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={marketerFilterOpen}
                className="w-full justify-between sm:w-[240px]"
              >
                {selectedMarketerLabel}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search marketers..." />
                <CommandList>
                  <CommandEmpty>No marketers found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setSelectedMarketerId(null);
                        setMarketerFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "ml-2 mr-2 h-4 w-4",
                          selectedMarketerId ? "opacity-0" : "opacity-100",
                        )}
                      />
                      All marketers
                    </CommandItem>
                    {marketerOptions.map((marketer) => {
                      const isSelected = selectedMarketerId === marketer.id;
                      return (
                        <CommandItem
                          key={marketer.id}
                          value={marketer.label}
                          onSelect={() => {
                            setSelectedMarketerId(marketer.id);
                            setMarketerFilterOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "ml-2 mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {marketer.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {filteredRows.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No marketer activity yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marketer</TableHead>
                <TableHead>Promo Codes</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.marketerId}>
                  <TableCell className="font-medium">
                    {row.marketerName}
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {row.referralCode}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.purchases)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.clicks)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.revenue, currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.commission, currency)}
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
