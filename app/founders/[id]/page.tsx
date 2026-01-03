"use client";

import { use } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useFounderProfile } from "@/lib/hooks/users";
import { parseUserMetadata } from "@/lib/services/user-metadata";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function FounderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: profile, isLoading, error } = useFounderProfile(id);

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

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Founder not found
        </div>
      </main>
    );
  }

  const { user, projects, stats } = profile;

  // Parse user metadata
  const metadata = parseUserMetadata(user.metadata);
  const xProfile = metadata.socialMedia?.x;
  const avatarUrl = xProfile?.handle
    ? `https://unavatar.io/x/${xProfile.handle.replace(/^@/, "")}`
    : null;

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
  const joinedDate = user.createdAt || new Date().toISOString();

  return (
    <main className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />
      {/* Vertical Lines Background Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl border-x border-border/40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
      </div>

      {/* Header / Hero Section */}
      <div className="relative border-b border-border/40 bg-muted/5 pt-24 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
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
                <BreadcrumbPage>{user.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex gap-6 items-center">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl shadow-sm border-2 border-primary/20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
                <AvatarFallback className="rounded-2xl text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {user.name}
                  </h1>
                  {user.stripeConnectedAccountId && (
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
                      @{xProfile.handle.replace(/^@/, "")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 lg:gap-6">
          {/* Left side: Stats cards and Projects (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Overall Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-2xl font-semibold mb-1">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total revenue
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-2xl font-semibold mb-1 text-emerald-600">
                  {formatCurrency(stats.totalCommissions)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Commissions paid
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-2xl font-semibold mb-1">
                  {formatCurrency(stats.combinedMRR)}
                </div>
                <div className="text-xs text-muted-foreground">Combined MRR</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-2xl font-semibold mb-1">
                  {stats.activeMarketers}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active marketers
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Projects</h2>
                <Badge variant="secondary" className="text-sm">
                  {stats.totalProjects} total
                </Badge>
              </div>

              <div className="space-y-4 grid">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No projects yet
                  </div>
                ) : (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group"
                    >
                      <Card className="border-border/50 bg-background/50 hover:border-primary/50 transition-colors">
                        <CardContent className="p-6 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <Avatar className="h-14 w-14 rounded-xl">
                                <AvatarImage
                                  src={project.logoUrl}
                                  alt={project.name}
                                />
                                <AvatarFallback className="rounded-xl">
                                  {project.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                    {project.name}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {project.category}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">
                                      Revenue
                                    </p>
                                    <p className="font-semibold">
                                      {formatCurrency(project.revenue)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">
                                      MRR
                                    </p>
                                    <p className="font-semibold">
                                      {formatCurrency(project.mrr)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">
                                      Marketers
                                    </p>
                                    <p className="font-semibold flex items-center gap-1">
                                      <Users className="h-3.5 w-3.5" />
                                      {project.marketers}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">
                                      Sales
                                    </p>
                                    <p className="font-semibold flex items-center gap-1">
                                      <ShoppingBag className="h-3.5 w-3.5" />
                                      {project.sales}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground mb-1">
                                Commissions
                              </p>
                              <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(project.commissions)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Since {formatDate(project.createdAt)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Portfolio Summary */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Total Projects
                    </span>
                    <span className="font-semibold">{stats.totalProjects}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Total Sales
                    </span>
                    <span className="font-semibold">
                      {stats.totalSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Avg. Commission Rate
                    </span>
                    <span className="font-semibold">
                      {projects.length > 0 ? "20%" : "0%"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Revenue Growth
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {stats.growth}
                    </Badge>
                  </div>
                </div>

                {projects.length > 0 && (
                  <div className="pt-4 border-t border-border/40">
                    <p className="text-xs text-muted-foreground mb-3">
                      Top performing project
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/20">
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage
                          src={projects[0].logoUrl}
                          alt={projects[0].name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {projects[0].name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{projects[0].name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(projects[0].revenue)} revenue
                        </p>
                      </div>
                    </div>
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
