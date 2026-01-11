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
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  affiliateRevenue: {
    label: "Affiliate",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

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
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter: (value: number) => string;
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
            chartConfig[key as keyof typeof chartConfig]?.label ||
            item.name ||
            key;
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
}: RevenueChartProps) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString("en-US", {
      day: "2-digit",
    }),
  }));

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
              tickFormatter={(value) => formatter.format(Number(value))}
              className="text-muted-foreground"
            />
            <ChartTooltip
              content={
                <RevenueTooltip formatter={(value) => formatter.format(value)} />
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
