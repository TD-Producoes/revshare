"use client";

import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  DollarSign,
  ExternalLink,
  Globe,
  LineChart,
  MapPin,
  PieChart,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  Twitter,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  usePublicMarketerProfile,
  useMarketerTestimonials,
} from "@/lib/hooks/marketer";
import { parseUserMetadata } from "@/lib/services/user-metadata";

// Helper functions

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMaxValue(
  data: Array<{ earnings: number; revenue: number }>,
  key: "earnings" | "revenue"
): number {
  if (data.length === 0) return 1;
  return Math.max(...data.map((d) => d[key]), 1);
}

export default function MarketerProfilePage() {
  const params = useParams();
  const marketerId = params?.id as string | undefined;

  const { data: profile, isLoading, error } = usePublicMarketerProfile(marketerId);
  const { data: testimonials = [], isLoading: isLoadingTestimonials } =
    useMarketerTestimonials(marketerId);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </main>
    );
  }

  if (error || !profile || !marketerId) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Marketer not found</div>
        </div>
      </main>
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
  const earningsTimeline = profile.earningsTimeline;
  const recentCommissions = profile.recentCommissions;

  const maxEarnings = getMaxValue(earningsTimeline, "earnings");
  const maxRevenue = getMaxValue(earningsTimeline, "revenue");

  // Format website URL
  const websiteDisplay = metadata.website
    ? metadata.website.replace(/^https?:\/\//, "")
    : null;
  const websiteHref = metadata.website
    ? (metadata.website.startsWith("http") ? metadata.website : `https://${metadata.website}`)
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

  // Performance metrics (using real data where available)
  const performanceMetrics = [
    {
      label: "Click-Through Rate",
      value: "8.2%", // Would need analytics data
      trend: "+2.1%",
      color: "text-blue-500",
    },
    {
      label: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      trend: "+0.5%",
      color: "text-emerald-500",
    },
    {
      label: "Avg. Order Value",
      value: stats.totalSales > 0
        ? formatCurrency(stats.totalRevenue / stats.totalSales)
        : "$0",
      trend: "+$45",
      color: "text-purple-500",
    },
    {
      label: "Customer Lifetime Value",
      value: "$2,450", // Would need analytics data
      trend: "+$320",
      color: "text-orange-500",
    },
  ];

  return (
    <main className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />
      {/* Vertical Lines Background Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl border-x border-border/40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
      </div>

      {/* Header / Hero Section */}
      <div className="relative border-b border-border/40 bg-muted/5 pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex gap-6 items-center">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl shadow-sm border-2 border-primary/20">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={profile.user.name} />
                )}
                <AvatarFallback className="rounded-2xl text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  {getInitials(profile.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {profile.user.name}
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
                      href={`https://x.com/${xProfile.handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      @{xProfile.handle.replace(/^@/, "")}
                    </a>
                  )}
                </div>
                {/* Badges */}
                {(badges.length > 0 || metadata.specialties || metadata.focusArea) && (
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
                Partner with {profile.user.name.split(" ")[0]}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Available for new partnerships
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1 text-emerald-600">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <div className="text-xs text-muted-foreground">Total earnings</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">Revenue generated</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1">
              {stats.activeProjects}
            </div>
            <div className="text-xs text-muted-foreground">Active projects</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-semibold mb-1">
              {stats.conversionRate}%
            </div>
            <div className="text-xs text-muted-foreground">Conversion rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column: Main Content */}
          <div className="space-y-6">
            {/* Earnings & Revenue Chart */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Earnings & Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly performance over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Chart */}
                  <div className="relative h-64">
                    {/* Earnings bars */}
                    <div className="absolute inset-0 flex items-end justify-between gap-1">
                      {earningsTimeline.map((item: { month: string; earnings: number; revenue: number }, i: number) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1 group"
                        >
                          <div
                            className="w-full bg-emerald-500/20 rounded-t hover:bg-emerald-500/30 transition-colors relative group-hover:bg-emerald-500/40"
                            style={{
                              height: `${(item.earnings / maxEarnings) * 100}%`,
                            }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs font-medium whitespace-nowrap">
                              {formatCurrency(item.earnings)}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Revenue line overlay */}
                    <div className="absolute inset-0 flex items-end justify-between">
                      {earningsTimeline.map((item: { month: string; earnings: number; revenue: number }, i: number) => (
                        <div
                          key={i}
                          className="flex-1 flex items-end justify-center"
                          style={{
                            height: `${(item.revenue / maxRevenue) * 100}%`,
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-0.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-emerald-500/20" />
                      <span className="text-muted-foreground">Earnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">
                        Revenue Generated
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  {projects.map((project: typeof projects[0]) => {
                    const percentage =
                      (project.revenue / stats.totalRevenue) * 100;
                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage
                                src={project.logoUrl}
                                alt={project.name}
                              />
                              <AvatarFallback className="rounded-lg text-xs">
                                {project.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {project.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(project.revenue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {percentage.toFixed(1)}%
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

            {/* Active Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Active Partnerships
              </h3>
              <div className="grid gap-4">
                {projects.map((project: typeof projects[0]) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group"
                  >
                    <Card className="border-border/50 bg-background/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12 rounded-xl">
                              <AvatarImage
                                src={project.logoUrl}
                                alt={project.name}
                              />
                              <AvatarFallback className="rounded-xl">
                                {project.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold group-hover:text-primary transition-colors">
                                  {project.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {project.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  {formatCurrency(project.revenue)} generated
                                </span>
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3.5 w-3.5" />
                                  {formatCurrency(project.earnings)} earned
                                </span>
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  {project.sales} sales
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
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="p-4 rounded-lg border border-border/40 bg-muted/20"
                    >
                      <p className="text-sm text-muted-foreground mb-1">
                        {metric.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold ${metric.color}`}>
                          {metric.value}
                        </p>
                        <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    <span className="font-semibold">{metadata.focusArea || "N/A"}</span>
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
                      Total Sales
                    </span>
                    <span className="font-semibold">
                      {stats.totalSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Growth
                    </span>
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
                  Partner with {profile.user.name.split(" ")[0]}
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
                    recentCommissions.map((commission: typeof recentCommissions[0]) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {commission.project}
                        </p>
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
                    ))
                  )}
                </div>
                <Button variant="ghost" className="w-full mt-4" size="sm">
                  View all commissions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
                        <p className="text-sm text-muted-foreground mb-2">
                          &ldquo;{testimonial.text}&rdquo;
                        </p>
                        <p className="text-xs font-medium">
                          — {testimonial.creatorName}, {testimonial.projectName}
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
    </main>
  );
}
