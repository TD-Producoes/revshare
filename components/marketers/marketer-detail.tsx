"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useMarketerTestimonials,
  usePublicMarketerProfile,
} from "@/lib/hooks/marketer";
import { parseUserMetadata } from "@/lib/services/user-metadata";
import { getAvatarFallback, isAnonymousName } from "@/lib/utils/anonymous";
import {
  ArrowUpRight,
  Award,
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  PieChart,
  ShieldCheck,
  ShoppingBag,
  Star,
  Twitter,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { RevenueChart } from "@/components/shared/revenue-chart";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/data/metrics";

// Helper functions

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function sumField(
  data: Array<{
    projectRevenue?: number;
    affiliateRevenue?: number;
    commissionOwed?: number;
    purchases?: number;
    customers?: number;
  }>,
  key:
    | "projectRevenue"
    | "affiliateRevenue"
    | "commissionOwed"
    | "purchases"
    | "customers"
): number {
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
    <Card className="border-border/50 bg-background/50">
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
            <ChartLegend
              content={(props) => (
                <ChartLegendContent
                  payload={props.payload}
                  verticalAlign={props.verticalAlign}
                />
              )}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type MarketerDetailProps = {
  /**
   * The marketer ID to display
   */
  marketerId: string;
  /**
   * Whether this is shown in a private dashboard context (with sidebar/header)
   * or public context (with navbar). Affects layout and header styling.
   */
  isPrivate?: boolean;
  /**
   * Base path for navigation links (e.g., "/marketers" for public, "/founder/discover-marketers" for dashboard)
   */
  basePath?: string;
};

export function MarketerDetail({
  marketerId,
  isPrivate = false,
  basePath = "/marketers",
}: MarketerDetailProps) {
  const {
    data: profile,
    isLoading,
    error,
  } = usePublicMarketerProfile(marketerId);
  const { data: testimonials = [], isLoading: isLoadingTestimonials } =
    useMarketerTestimonials(marketerId);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error || !profile || !profile.user) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Marketer not found
      </div>
    );
  }

  // Parse user metadata
  const metadata = parseUserMetadata(profile.user.metadata);
  const xProfile = metadata.socialMedia?.x;
  const avatarUrl = xProfile?.handle
    ? `https://unavatar.io/x/${xProfile.handle.replace(/^@/, "")}`
    : null;

  // Format data
  const stats = profile.stats;
  const projects = profile.projects;
  const recentCommissions = profile.recentCommissions;
  const metrics = profile.metrics;

  // Format website URL
  const websiteDisplay = metadata.website
    ? metadata.website.replace(/^https?:\/\//, "")
    : null;
  const websiteHref = metadata.website
    ? metadata.website.startsWith("http")
      ? metadata.website
      : `https://${metadata.website}`
    : null;

  // Format joined date
  const joinedDate = profile.user.createdAt;

  // Get badges from metadata (if available)
  const badges: string[] = [];
  if (profile.user.metadata && typeof profile.user.metadata === "object") {
    const meta = profile.user.metadata as Record<string, unknown>;
    if (Array.isArray(meta.badges)) {
      badges.push(...(meta.badges as string[]));
    }
  }

  return (
    <div className="space-y-6 selection:bg-primary/10">
      {/* Header / Hero Section */}
      {isPrivate ? (
        // Private dashboard header - consistent with other dashboard pages
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={basePath}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1
              className={`text-2xl font-bold ${
                isAnonymousName(profile.user.name) ? "blur-xs opacity-60" : ""
              }`}
            >
              {profile.user.name ?? "Anonymous Marketer"}
            </h1>
            {xProfile?.verified && (
              <Badge
                variant="outline"
                className="border-emerald-500/20 text-emerald-600 bg-emerald-500/10 gap-1"
              >
                <ShieldCheck className="h-3 w-3" /> Verified
              </Badge>
            )}
          </div>
          {metadata.bio && (
            <p className="text-muted-foreground max-w-3xl">{metadata.bio}</p>
          )}
        </div>
      ) : (
        // Public header - full hero section with breadcrumbs
        <div className="relative border-b border-border/40 bg-muted/5 pt-24 pb-12 lg:pt-24 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-6 relative z-10">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={basePath}>Marketers</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage
                    className={isAnonymousName(profile.user.name) ? "blur-xs opacity-60" : ""}
                  >
                    {profile.user.name ?? "Anonymous Marketer"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex gap-6 items-center">
                {isAnonymousName(profile.user.name) ? (
                  // Show spy icon for GHOST marketers
                  <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-muted border-2 border-border shadow-sm">
                    {getAvatarFallback(profile.user.name, "h-10 w-10 md:h-12 md:w-12")}
                  </div>
                ) : (
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl shadow-sm border-2 border-primary/20">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={profile.user.name || "Anonymous"} />
                    )}
                    <AvatarFallback className="rounded-2xl text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      {getAvatarFallback(profile.user.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1
                      className={`text-3xl md:text-4xl font-bold tracking-tight transition-all ${
                        isAnonymousName(profile.user.name) ? "blur-xs opacity-60" : ""
                      }`}
                    >
                      {profile.user.name ?? "Anonymous Marketer"}
                    </h1>
                    {xProfile?.verified && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/20 text-emerald-600 bg-emerald-500/10 gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  {metadata.bio && (
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      {metadata.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                    {metadata.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {metadata.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(joinedDate)}
                    </div>
                    {websiteHref && websiteDisplay && (
                      <a
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {xProfile && (
                      <a
                        href={`https://x.com/${xProfile.handle.replace(
                          /^@/,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Twitter className="h-4 w-4" />@
                        {xProfile.handle.replace(/^@/, "")}
                      </a>
                    )}
                  </div>
                  {/* Badges */}
                  {(badges.length > 0 ||
                    metadata.specialties ||
                    metadata.focusArea) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {badges.map((badge) => (
                        <Badge
                          key={badge}
                          variant="secondary"
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          <Award className="h-3 w-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                      {metadata.focusArea && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          {metadata.focusArea}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-semibold text-base"
                >
                  Partner with{" "}
                  {profile.user.name
                    ? profile.user.name.split(" ")[0]
                    : "this marketer"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Available for new partnerships
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isPrivate ? "space-y-6" : "mx-auto max-w-7xl p-6"}>
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1 text-emerald-600">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <div className="text-xs text-muted-foreground">Total Earnings</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              Revenue Generated
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1">
              {stats.activeProjects}
            </div>
            <div className="text-xs text-muted-foreground">Active Projects</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1">
              {metrics
                ? metrics.summary.totalPurchases.toLocaleString()
                : stats.totalSales.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Purchases</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1 text-purple-600">
              {metrics
                ? formatCurrency(metrics.summary.totalCommissionOwed)
                : formatCurrency(0)}
            </div>
            <div className="text-xs text-muted-foreground">Commission Owed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column: Main Content */}
          <div className="space-y-6">
            {/* Metrics Charts */}
            {metrics && metrics.dailyTimeline.length > 0 && (
              <>
                <RevenueChart
                  data={metrics.dailyTimeline.map((entry) => ({
                    date: entry.date,
                    revenue: entry.projectRevenue,
                    affiliateRevenue: entry.affiliateRevenue,
                  }))}
                  title="Affiliate vs Project Revenue"
                  showAffiliate={true}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <MetricAreaChart
                    title="Purchases (Last 30 Days)"
                    data={metrics.dailyTimeline.map((entry) => ({
                      date: entry.date,
                      purchases: entry.purchases,
                    }))}
                    config={{
                      purchases: {
                        label: "Purchases",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    valueFormatter={(value) => formatNumber(value)}
                  />

                  <MetricAreaChart
                    title="Customers (Last 30 Days)"
                    data={metrics.dailyTimeline.map((entry) => ({
                      date: entry.date,
                      customers: entry.customers,
                    }))}
                    config={{
                      customers: {
                        label: "Customers",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    valueFormatter={(value) => formatNumber(value)}
                  />
                </div>
              </>
            )}

            {/* Revenue by Project Chart */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Revenue by Project
                </CardTitle>
                <CardDescription>
                  Distribution of revenue across active partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project: (typeof projects)[0]) => {
                    // Helper function to check if a value is hidden (-1 means hidden by visibility settings)
                    const isHidden = (value: number | -1): boolean => {
                      return value === -1;
                    };

                    // Helper function to get display value (return null if hidden, otherwise return the value)
                    const getDisplayValue = (
                      value: number | -1
                    ): number | null => {
                      if (isHidden(value)) return null;
                      return value;
                    };

                    const isAnonymous = isAnonymousName(project.name);
                    const revenue = getDisplayValue(project.revenue) ?? 0;
                    const percentage =
                      stats.totalRevenue > 0
                        ? (revenue / stats.totalRevenue) * 100
                        : 0;

                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage
                                src={project.logoUrl ?? undefined}
                                alt={project.name}
                              />
                              <AvatarFallback className="rounded-lg text-xs">
                                {project.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                href={`/projects/${project.id}`}
                                className={`font-medium transition-all hover:text-primary ${
                                  isAnonymous ? "blur-xs opacity-60" : ""
                                }`}
                              >
                                {project.name}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {project.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold transition-all ${
                                isHidden(project.revenue)
                                  ? "blur-xs opacity-60"
                                  : ""
                              }`}
                            >
                              {isHidden(project.revenue)
                                ? "—"
                                : formatCurrency(project.revenue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isHidden(project.revenue)
                                ? "—"
                                : `${percentage.toFixed(1)}%`}
                            </p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Per-Project Metrics Breakdown */}
            {metrics && metrics.projectMetrics.length > 0 && (
              <Card className="border-border/50 bg-background/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Project Metrics Breakdown
                  </CardTitle>
                  <CardDescription>
                    Detailed metrics per project from snapshots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.projectMetrics.map((projectMetric) => {
                      // Helper function to check if a value is hidden (-1 means hidden by visibility settings)
                      const isHidden = (value: number | -1): boolean => {
                        return value === -1;
                      };

                      const project = projects.find(
                        (p) => p.id === projectMetric.projectId
                      );
                      const isAnonymous =
                        projectMetric.projectName === "Anonymous Project";
                      return (
                        <div
                          key={projectMetric.projectId}
                          className="space-y-3 p-4 rounded-lg border border-border/40 bg-muted/10"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage
                                src={project?.logoUrl ?? undefined}
                                alt={projectMetric.projectName}
                              />
                              <AvatarFallback className="rounded-lg text-xs">
                                {projectMetric.projectName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                href={`/projects/${projectMetric.projectId}`}
                                className={`font-semibold transition-all hover:text-primary ${
                                  isAnonymous ? "blur-xs opacity-60" : ""
                                }`}
                              >
                                {projectMetric.projectName}
                              </Link>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Project Revenue
                              </p>
                              <p
                                className={`font-semibold transition-all ${
                                  isHidden(projectMetric.totalProjectRevenue)
                                    ? "blur-xs opacity-60"
                                    : ""
                                }`}
                              >
                                {isHidden(projectMetric.totalProjectRevenue)
                                  ? "—"
                                  : formatCurrency(
                                      projectMetric.totalProjectRevenue
                                    )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Affiliate Revenue
                              </p>
                              <p
                                className={`font-semibold text-blue-600 transition-all ${
                                  isHidden(projectMetric.totalAffiliateRevenue)
                                    ? "blur-xs opacity-60"
                                    : ""
                                }`}
                              >
                                {isHidden(projectMetric.totalAffiliateRevenue)
                                  ? "—"
                                  : formatCurrency(
                                      projectMetric.totalAffiliateRevenue
                                    )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Commission Owed
                              </p>
                              <p
                                className={`font-semibold text-purple-600 transition-all ${
                                  isHidden(projectMetric.totalCommissionOwed)
                                    ? "blur-xs opacity-60"
                                    : ""
                                }`}
                              >
                                {isHidden(projectMetric.totalCommissionOwed)
                                  ? "—"
                                  : formatCurrency(
                                      projectMetric.totalCommissionOwed
                                    )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Purchases
                              </p>
                              <p
                                className={`font-semibold transition-all ${
                                  isHidden(projectMetric.totalPurchases)
                                    ? "blur-xs opacity-60"
                                    : ""
                                }`}
                              >
                                {isHidden(projectMetric.totalPurchases)
                                  ? "—"
                                  : projectMetric.totalPurchases.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Customers
                              </p>
                              <p
                                className={`font-semibold transition-all ${
                                  isHidden(projectMetric.totalCustomers)
                                    ? "blur-xs opacity-60"
                                    : ""
                                }`}
                              >
                                {isHidden(projectMetric.totalCustomers)
                                  ? "—"
                                  : projectMetric.totalCustomers.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Active Partnerships
              </h3>
              <div className="grid gap-4">
                {projects.map((project: (typeof projects)[0]) => {
                  // Helper function to check if a value is hidden (-1 means hidden by visibility settings)
                  const isHidden = (value: number | -1): boolean => {
                    return value === -1;
                  };

                  const isAnonymous = project.name === "Anonymous Project";

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group"
                    >
                      <Card className="border-border/50 bg-background/50 hover:border-primary/50 transition-colors">
                        <CardContent className="px-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <Avatar className="h-12 w-12 rounded-xl">
                                <AvatarImage
                                  src={project.logoUrl ?? undefined}
                                  alt={project.name}
                                />
                                <AvatarFallback className="rounded-xl">
                                  {project.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4
                                    className={`font-semibold group-hover:text-primary transition-colors ${
                                      isAnonymous ? "blur-xs opacity-60" : ""
                                    }`}
                                  >
                                    {project.name}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {project.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span
                                    className={`flex items-center gap-1 transition-all ${
                                      isHidden(project.revenue)
                                        ? "blur-xs opacity-60"
                                        : ""
                                    }`}
                                  >
                                    {isHidden(project.revenue)
                                      ? "—"
                                      : `${formatCurrency(project.revenue)} generated`}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 transition-all ${
                                      isHidden(project.earnings)
                                        ? "blur-xs opacity-60"
                                        : ""
                                    }`}
                                  >
                                    {isHidden(project.earnings)
                                      ? "—"
                                      : `${formatCurrency(project.earnings)} earned`}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 transition-all ${
                                      isHidden(project.sales)
                                        ? "blur-xs opacity-60"
                                        : ""
                                    }`}
                                  >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                    {isHidden(project.sales)
                                      ? "—"
                                      : `${project.sales} sales`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                {project.commission}% commission
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Since {formatDate(project.joinedDate)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-border/50 top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Focus Area
                    </span>
                    <span className="font-semibold">
                      {metadata.focusArea || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Avg. Commission
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {stats.avgCommission}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Customers
                    </span>
                    <span className="font-semibold">
                      {formatNumber(sumField(metrics.dailyTimeline, "customers"))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Growth</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {stats.growth}
                    </Badge>
                  </div>
                </div>

                {/* Specialties */}
                {metadata.specialties && metadata.specialties.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Specialties
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {metadata.specialties.map((specialty, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-muted"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full h-11 rounded-xl shadow-md" size="lg">
                  Partner with{" "}
                  {profile.user.name
                    ? profile.user.name.split(" ")[0]
                    : "this marketer"}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Commissions */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="text-base">Recent Commissions</CardTitle>
                <CardDescription>Latest earnings activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCommissions.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No commissions yet
                    </div>
                  ) : (
                    recentCommissions.map(
                      (commission: (typeof recentCommissions)[0]) => (
                        <div
                          key={commission.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20"
                        >
                          <div>
                            <Link
                              href={`/projects/${commission.projectId}`}
                              className="font-medium text-sm hover:text-primary transition-colors"
                            >
                              {commission.project}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {commission.sales} sales •{" "}
                              {new Date(commission.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">
                              {formatCurrency(commission.amount)}
                            </p>
                            <Badge
                              variant={
                                commission.status === "paid"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px] mt-1"
                            >
                              {commission.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Testimonials */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Testimonials
                  {testimonials.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({testimonials.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingTestimonials ? (
                  <div className="text-sm text-muted-foreground py-4">
                    Loading testimonials...
                  </div>
                ) : testimonials.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">
                    No testimonials yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="p-4 rounded-lg border border-border/40 bg-muted/10"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < testimonial.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        {testimonial.text ? (
                          <p className="text-sm text-muted-foreground mb-2">
                            &ldquo;{testimonial.text}&rdquo;
                          </p>
                        ) : (
                          // Show blurred dummy text for GHOST marketers
                          <p className="text-sm text-muted-foreground mb-2 blur-xs opacity-60">
                            &ldquo;This testimonial text is hidden to protect the
                            marketer&apos;s identity.&rdquo;
                          </p>
                        )}
                        <p className="text-xs font-medium">
                          — {testimonial.creatorName},{" "}
                          {testimonial.projectName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

