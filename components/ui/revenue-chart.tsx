"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { RevenueDataPoint } from "@/lib/hooks/projects";

// Chart colors - yellow/orange shades that work in both light and dark mode
const CHART_COLORS = {
  total: "#facc15", // yellow-400 (brighter)
  affiliate: "#ea580c", // orange-600 (darker orange)
};

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency?: string;
}

function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatYAxis(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
      style={{ fontSize: "12px" }}
    >
      <p className="mb-2 font-medium">{formatDateLabel(label as string)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span style={{ color: entry.color }}>
            {entry.dataKey === "total" ? "Total Revenue" : "Affiliate Revenue"}
          </span>
          <span>: {formatCurrency(entry.value as number, currency)}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, currency = "USD" }: RevenueChartProps) {
  // Show every 5th label to avoid crowding
  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.total} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAffiliate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.affiliate} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.affiliate} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
          opacity={0.4}
        />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          tickFormatter={formatDateLabel}
          interval={tickInterval}
          dy={5}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          tickFormatter={(value) => formatYAxis(value, currency)}
          width={45}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={CHART_COLORS.total}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTotal)"
        />
        <Area
          type="monotone"
          dataKey="affiliate"
          stroke={CHART_COLORS.affiliate}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAffiliate)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
