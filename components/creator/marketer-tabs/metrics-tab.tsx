"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Check, ChevronsUpDown } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";

type TooltipPayloadItem = {
  name?: string;
  dataKey?: string;
  value?: number;
  color?: string;
};

function MetricTooltip({
  active,
  payload,
  label,
  formatter,
  config,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter: (value: number) => string;
  config: ChartConfig;
}) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((item) => item.value != null);

  return (
    <div className="rounded-2xl border border-border/60 bg-popover/95 px-4 py-3 text-sm shadow-2xl">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="mt-2 space-y-1">
        {rows.map((item) => {
          const key = item.dataKey ?? item.name ?? "value";
          const labelText = config[key as keyof typeof config]?.label || item.name || key;
          return (
            <div key={key} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-3 w-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{labelText}</span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {formatter(Number(item.value))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type MetricsTimeline = Array<{
  date: string;
  projectRevenue: number;
  affiliateRevenue: number;
  commissionOwed: number;
  purchasesCount: number;
  projectPurchasesCount?: number;
  customersCount: number;
  projectCustomersCount?: number;
  clicksCount?: number;
  installsCount?: number;
}>;

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
                <MetricTooltip
                  formatter={(value) => valueFormatter(value)}
                  config={config}
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

export function MarketerMetricsTab({
  timeline,
  currency,
  projects,
  selectedProjectId,
  onSelectProject,
  isProjectLoading,
  showProjectFilter = true,
  clicksTotal,
  installsTotal,
}: {
  timeline: MetricsTimeline;
  currency: string;
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  isProjectLoading?: boolean;
  showProjectFilter?: boolean;
  clicksTotal?: number;
  installsTotal?: number;
}) {
  const selectedProjectLabel =
    projects.find((project) => project.id === selectedProjectId)?.name ??
    "All projects";

  const hasProjectPurchases = timeline.some(
    (entry) => entry.projectPurchasesCount != null,
  );
  const hasProjectCustomers = timeline.some(
    (entry) => entry.projectCustomersCount != null,
  );
  const purchasesChartData = timeline.map((entry) => ({
    date: entry.date,
    revenue: hasProjectPurchases
      ? entry.projectPurchasesCount ?? 0
      : entry.purchasesCount ?? 0,
    affiliateRevenue: hasProjectPurchases ? entry.purchasesCount ?? 0 : 0,
  }));
  const customersChartData = timeline.map((entry) => ({
    date: entry.date,
    customers: entry.customersCount ?? 0,
    ...(hasProjectCustomers
      ? { projectCustomers: entry.projectCustomersCount ?? 0 }
      : {}),
  }));
  const clicksChartData = timeline.map((entry) => ({
    date: entry.date,
    clicks: entry.clicksCount ?? 0,
  }));
  const installsChartData = timeline.map((entry) => ({
    date: entry.date,
    installs: entry.installsCount ?? 0,
  }));

  const purchasesPrimaryLabel = hasProjectPurchases
    ? "Total Purchases"
    : "Purchases";
  const purchasesSecondaryLabel = hasProjectPurchases
    ? "Affiliate Purchases"
    : "";

  const customersConfig = hasProjectCustomers
    ? ({
        projectCustomers: {
          label: "Total Customers",
          color: "var(--chart-1)",
        },
        customers: {
          label: "Affiliate Customers",
          color: "var(--chart-2)",
        },
      } satisfies ChartConfig)
    : ({
        customers: {
          label: "Customers",
          color: "var(--primary)",
        },
      } satisfies ChartConfig);
  const clicksConfig = {
    clicks: {
      label: "Clicks",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;
  const installsConfig = {
    installs: {
      label: "Installs",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;
  return (
    <div className="space-y-6">
      {showProjectFilter ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between sm:w-[240px]"
                disabled={isProjectLoading}
              >
                {selectedProjectLabel}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search projects..." />
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="all" onSelect={() => onSelectProject(null)}>
                      <Check
                        className={cn(
                          "ml-2 mr-2 h-4 w-4",
                          selectedProjectId ? "opacity-0" : "opacity-100",
                        )}
                      />
                      All projects
                    </CommandItem>
                    {projects.map((project) => {
                      const isSelected = selectedProjectId === project.id;
                      return (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => onSelectProject(project.id)}
                        >
                          <Check
                            className={cn(
                              "ml-2 mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {project.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart
          data={timeline.map((entry) => ({
            date: entry.date,
            revenue: entry.projectRevenue / 100,
            affiliateRevenue: entry.affiliateRevenue / 100,
          }))}
          title={
            selectedProjectId
              ? "Affiliate vs Project Revenue"
              : "Total vs Affiliate Revenue"
          }
          showAffiliate={true}
          currency={currency}
        />
        <RevenueChart
          title="Purchases (Last 30 Days)"
          data={purchasesChartData}
          showAffiliate={hasProjectPurchases}
          primaryLabel={purchasesPrimaryLabel}
          secondaryLabel={purchasesSecondaryLabel}
          valueFormatter={(value) => formatNumber(value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricAreaChart
          title="Customers (Last 30 Days)"
          data={customersChartData}
          config={customersConfig}
          valueFormatter={(value) => formatNumber(value)}
        />
        <MetricAreaChart
          title="Clicks (Last 30 Days)"
          data={clicksChartData}
          config={clicksConfig}
          valueFormatter={(value) => formatNumber(value)}
        />
        <MetricAreaChart
          title="Installs (Last 30 Days)"
          data={installsChartData}
          config={installsConfig}
          valueFormatter={(value) => formatNumber(value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">30-Day Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Affiliate revenue</span>
              <span className="font-medium">
                {formatCurrency(sumField(timeline, "affiliateRevenue"), currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Commission owed</span>
              <span className="font-medium">
                {formatCurrency(sumField(timeline, "commissionOwed"), currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Purchases</span>
              <span className="font-medium">
                {formatNumber(sumField(timeline, "purchasesCount"))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Customers</span>
              <span className="font-medium">
                {formatNumber(sumField(timeline, "customersCount"))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Clicks</span>
              <span className="font-medium">
                {formatNumber(sumField(timeline, "clicksCount"))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Installs</span>
              <span className="font-medium">
                {formatNumber(sumField(timeline, "installsCount"))}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">
              {formatNumber(clicksTotal ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              All-time clicks for this marketer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Installs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">
              {formatNumber(installsTotal ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              All-time installs for this marketer
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
