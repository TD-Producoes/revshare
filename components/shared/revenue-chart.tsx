"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    affiliateRevenue: number;
  }>;
  title?: string;
  showAffiliate?: boolean;
  currency?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  valueFormatter?: (value: number) => string;
}

type TooltipPayloadItem = {
  name?: string;
  dataKey?: string;
  value?: number;
  color?: string;
};

function RevenueTooltip({
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
          const labelText =
            config[key as keyof typeof config]?.label || item.name || key;
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

export function RevenueChart({
  data,
  title = "Revenue Over Time",
  showAffiliate = true,
  currency = "USD",
  primaryLabel,
  secondaryLabel,
  valueFormatter,
}: RevenueChartProps) {
  const fallbackFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const formatValue = valueFormatter
    ? valueFormatter
    : (value: number) => fallbackFormatter.format(value);
  const chartConfig = {
    revenue: {
      label: primaryLabel ?? "Total",
      color: "#facc15", // yellow-400 (brighter)
    },
    affiliateRevenue: {
      label: secondaryLabel ?? "Affiliate",
      color: "#ea580c", // orange-600 (darker orange)
    },
  } satisfies ChartConfig;

  const toDateKey = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
      value.getDate(),
    ).padStart(2, "0")}`;

  const dataByDay = new Map(
    data
      .map((item) => {
        const parsed = new Date(item.date);
        if (Number.isNaN(parsed.getTime())) return null;
        return [
          toDateKey(parsed),
          { revenue: item.revenue, affiliateRevenue: item.affiliateRevenue },
        ] as const;
      })
      .filter(Boolean) as Array<
      readonly [string, { revenue: number; affiliateRevenue: number }]
    >,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formattedData = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const dateKey = toDateKey(date);
    const values = dataByDay.get(dateKey) ?? {
      revenue: 0,
      affiliateRevenue: 0,
    };
    return {
      date: dateKey,
      ...values,
      dateLabel: date.toLocaleDateString("en-US", { day: "2-digit" }),
    };
  });

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart
            data={formattedData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.08}
                />
              </linearGradient>
              <linearGradient id="fillAffiliateRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-affiliateRevenue)"
                  stopOpacity={1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-affiliateRevenue)"
                  stopOpacity={0.06}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-muted/20"
            />
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={13}
              interval="preserveStartEnd"
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => formatValue(Number(value))}
              className="text-muted-foreground"
            />
            <ChartTooltip
              content={
                <RevenueTooltip
                  formatter={(value) => formatValue(value)}
                  config={chartConfig}
                />
              }
            />
            <Area
              type="linear"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 3,
                stroke: "hsl(var(--background))",
                fill: "var(--color-revenue)",
              }}
            />
            {showAffiliate && (
              <Area
                type="linear"
                dataKey="affiliateRevenue"
                stroke="var(--color-affiliateRevenue)"
                fill="url(#fillAffiliateRevenue)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 3,
                  stroke: "hsl(var(--background))",
                  fill: "var(--color-affiliateRevenue)",
                }}
              />
            )}
            <ChartLegend
              content={
                <ChartLegendContent className="pt-4 text-sm text-foreground" />
              }
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
