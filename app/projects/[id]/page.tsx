"use client";

import { use } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/ui/image-gallery";
import { RevenueChart } from "@/components/ui/revenue-chart";
import { getCountryName } from "@/lib/data/countries";
import {
  formatFollowerCount,
  parseUserMetadata,
} from "@/lib/services/user-metadata";
import {
  ArrowUpRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useProjectProfile } from "@/lib/hooks/projects";

function formatCurrency(value: number, currency: string = "USD"): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatFoundedYear(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear().toString();
}

function formatCommission(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  // If stored as decimal (0.20), convert to percentage
  if (num > 0 && num <= 1) {
    return `${Math.round(num * 100)}%`;
  }
  return `${Math.round(num)}%`;
}

function formatWebsiteUrl(website: string | null | undefined): string | null {
  if (!website) return null;
  // Remove protocol for display
  return website.replace(/^https?:\/\//, "");
}

function getWebsiteHref(website: string | null | undefined): string | null {
  if (!website) return null;
  // Add protocol if missing
  if (website.startsWith("http://") || website.startsWith("https://")) {
    return website;
  }
  return `https://${website}`;
}

function getCountryFlagUrl(countryCode: string): string {
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
}

export default function ProjectProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: profileData, isLoading, error } = useProjectProfile(id);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </main>
    );
  }

  if (error || !profileData) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Project not found
        </div>
      </main>
    );
  }

  const { project, stats, user } = profileData;

  const foundedYear = formatFoundedYear(project.foundationDate);
  const countryName = project.country ? getCountryName(project.country) : null;
  const websiteDisplay = formatWebsiteUrl(project.website);
  const websiteHref = getWebsiteHref(project.website);
  const commission = formatCommission(project.marketerCommissionPercent);
  const features = project.features ?? [];
  const images = project.imageUrls ?? [];
  const hasStats =
    stats && (stats.activeMarketers > 0 || stats.totalPurchases > 0);
  const hasRevenueData = stats && stats.totalRevenue > 0;
  const hasChartData =
    stats && stats.revenueTimeline.some((d) => d.total > 0);
  const currency = project.currency?.toUpperCase() || "USD";

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
                {project.logoUrl && (
                  <AvatarImage src={project.logoUrl} alt={project.name} />
                )}
                <AvatarFallback className="rounded-2xl text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  {getInitials(project.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {project.name}
                  </h1>
                  {project.creatorStripeAccountId && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 text-emerald-600 bg-emerald-500/10 gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    {project.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                  {project.category && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {project.category}
                    </div>
                  )}
                  {websiteDisplay && websiteHref && (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      {websiteDisplay}
                    </a>
                  )}
                  {foundedYear && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Launched in {foundedYear}
                    </div>
                  )}
                  {project.country && countryName && (
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={getCountryFlagUrl(project.country)}
                        alt={`${countryName} flag`}
                        width={20}
                        height={14}
                        className="object-cover rounded-sm"
                      />
                      {countryName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-semibold text-base"
              >
                Apply to Promote
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Usually responds in 24h
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column: Main Content */}
          <div className="space-y-10">
            {/* Performance Stats & Chart */}
            {hasRevenueData && stats && (
              <div className="space-y-5">
                {/* Stats Grid - Clean minimal cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-2xl font-semibold mb-1">
                      {formatCurrency(stats.totalRevenue, currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total revenue
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-2xl font-semibold mb-1">
                      {formatCurrency(stats.mrr, currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      MRR (estimated)
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-2xl font-semibold mb-1">
                      {formatCurrency(stats.affiliateRevenue, currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Affiliate revenue
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-2xl font-semibold mb-1">
                      {stats.avgPaidCommission != null
                        ? formatCurrency(stats.avgPaidCommission, currency)
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg commission
                    </div>
                  </div>
                </div>
                {/* Revenue Chart */}
                {hasChartData && (
                  <div className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium">
                        Revenue (last 30 days)
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-muted-foreground">Total</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground">
                            Affiliate
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <RevenueChart
                        data={stats.revenueTimeline}
                        currency={currency}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* About Section */}
            {project.about && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">About the Project</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.about}
                </p>
              </div>
            )}
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gallery</h3>
                <ImageGallery images={images} alt={project.name} />
              </div>
            )}

            {/* Features/Benefits (if not shown in sidebar) */}
            {features.length > 0 && (
              <div className="space-y-4 lg:hidden">
                <h3 className="text-lg font-semibold">Key Features</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Key Details & Sticky Sidebar */}
          <div className="space-y-6">
            {/* Founder Info Card */}
            {user?.name && (
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Founder</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/founders/${user.id}`}
                    className="flex items-center gap-3 group"
                  >
                    {(() => {
                      const metadata = parseUserMetadata(user.metadata);
                      const xProfile = metadata.socialMedia?.x;
                      const avatarUrl = xProfile?.handle
                        ? `https://unavatar.io/x/${xProfile.handle.replace(/^@/, "")}`
                        : null;

                      return (
                        <Avatar className="h-8 w-8 shrink-0">
                          {avatarUrl && (
                            <AvatarImage src={avatarUrl} alt={user.name} />
                          )}
                          <AvatarFallback className="bg-muted text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors">
                        {user.name}
                      </p>
                      {(() => {
                        const metadata = parseUserMetadata(user.metadata);
                        const xProfile = metadata.socialMedia?.x;
                        if (xProfile?.followerCount) {
                          return (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatFollowerCount(xProfile.followerCount)}{" "}
                              followers on 𝕏
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Partnership Details Card */}
            <Card className="border-border/50 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Partnership Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Stats Row */}
                {hasStats && stats && (
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border/40">
                    <div>
                      <div className="text-2xl font-semibold">
                        {stats.activeMarketers}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Partners
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">
                        {stats.totalPurchases}
                      </div>
                      <div className="text-xs text-muted-foreground">Sales</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">
                        {stats.avgCommissionPercent != null
                          ? `${stats.avgCommissionPercent}%`
                          : commission}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg rate
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Commission
                    </span>
                    <span className="font-semibold">{commission}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Currency
                    </span>
                    <span className="font-semibold">{currency}</span>
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="space-y-3 hidden lg:block">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                      {features.length > 5 && (
                        <li className="text-xs text-muted-foreground">
                          +{features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <Button className="w-full h-11 rounded-xl shadow-md" size="lg">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
