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
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    affiliateRevenue: number;
  }>;
  title?: string;
  showAffiliate?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Total Revenue",
    color: "hsl(var(--chart-1))",
  },
  affiliateRevenue: {
    label: "Affiliate Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function RevenueChart({
  data,
  title = "Revenue Over Time",
  showAffiliate = true,
}: RevenueChartProps) {
  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
              }
            />
          <Area
            type="monotone"
            dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="var(--color-revenue)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          {showAffiliate && (
            <Area
              type="monotone"
              dataKey="affiliateRevenue"
              stroke="var(--color-affiliateRevenue)"
              fill="var(--color-affiliateRevenue)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </CardContent>
  </Card>
  );
}
