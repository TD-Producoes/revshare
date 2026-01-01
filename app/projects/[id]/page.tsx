import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/ui/image-gallery";
import { getCountryName } from "@/lib/data/countries";
import {
  ArrowUpRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  Users,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { notFound } from "next/navigation";
import type { PublicProjectStats } from "@/lib/hooks/projects";

type ProjectData = {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string | null;
  } | null;
  name: string;
  description?: string | null;
  category?: string | null;
  currency?: string | null;
  marketerCommissionPercent?: string | number | null;
  creatorStripeAccountId?: string | null;
  country?: string | null;
  website?: string | null;
  foundationDate?: string | Date | null;
  about?: string | null;
  features?: string[] | null;
  logoUrl?: string | null;
  imageUrls?: string[] | null;
  createdAt?: string | null;
};

async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/projects/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

async function getPublicStats(id: string): Promise<PublicProjectStats | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/projects/${id}/public-stats`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatFoundedYear(date: string | Date | null | undefined): string | null {
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

export default async function ProjectProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, stats] = await Promise.all([
    getProject(id),
    getPublicStats(id),
  ]);

  if (!project) {
    notFound();
  }

  const foundedYear = formatFoundedYear(project.foundationDate);
  const countryName = project.country ? getCountryName(project.country) : null;
  const websiteDisplay = formatWebsiteUrl(project.website);
  const websiteHref = getWebsiteHref(project.website);
  const commission = formatCommission(project.marketerCommissionPercent);
  const features = project.features ?? [];
  const images = project.imageUrls ?? [];
  const hasStats = stats && (stats.activeMarketers > 0 || stats.totalPurchases > 0);

  return (
    <main className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />
      {/* Vertical Lines Background Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl border-x border-border/40">
        <div className="absolute inset-y-0 left-[65.5%] w-px bg-border/40 hidden lg:block" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
      </div>

      {/* Header / Hero Section */}
      <div className="relative border-b border-border/40 bg-muted/5 pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex gap-6 items-center">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl shadow-sm">
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
                  {countryName && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {countryName}
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
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {foundedYear && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Launched in {foundedYear}
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

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
          {/* Left Column: Main Content */}
          <div className="space-y-10">

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

            {/* Creator Info */}
            {project.user?.name && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Created By</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-sm">
                      {getInitials(project.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{project.user.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Key Details & Sticky Sidebar */}
          <div className="space-y-8">
            <Card className="border-border/50 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Partnership Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Stats Row */}
                {hasStats && (
                  <div className="flex items-center justify-between gap-2 text-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-lg font-bold">{stats.activeMarketers}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Partners</p>
                    </div>
                    <div className="w-px h-10 bg-border/40" />
                    <div className="flex-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-lg font-bold">{stats.totalPurchases}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sales</p>
                    </div>
                    <div className="w-px h-10 bg-border/40" />
                    <div className="flex-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                        <Percent className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{stats.avgCommissionPercent != null ? `${stats.avgCommissionPercent}%` : commission}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Rate</p>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Commission
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {commission}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Currency
                    </span>
                    <span className="font-medium">
                      {project.currency?.toUpperCase() || "USD"}
                    </span>
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
