"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useProjectProfile } from "@/lib/hooks/projects";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import {
  useContractsForMarketer,
  useCreateContract,
} from "@/lib/hooks/contracts";
import { getAvatarFallback, isAnonymousName } from "@/lib/utils/anonymous";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectRewards } from "@/components/projects/project-rewards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApplyToPromoteDialog } from "@/components/marketer/apply-to-promote-dialog";

type ProjectDetailProps = {
  /**
   * The project ID to display
   */
  projectId: string;
  /**
   * Whether this is shown in a private dashboard context (with sidebar/header)
   * or public context (with navbar). Affects layout and header styling.
   */
  isPrivate?: boolean;
  /**
   * Base path for navigation links (e.g., "/projects" for public, "/marketer/projects" for dashboard)
   */
  basePath?: string;
};

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

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
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

/**
 * Reusable Project Detail component that can be used in both public and private contexts.
 * Displays full project information with stats, charts, and details.
 */
export function ProjectDetail({
  projectId,
  isPrivate = false,
  basePath = "/projects",
}: ProjectDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: profileData, isLoading, error } = useProjectProfile(projectId);
  const { data: authUserId } = useAuthUserId();
  const { data: currentUser } = useUser(authUserId);
  // Only fetch contracts if user is a marketer
  const { data: contracts = [] } = useContractsForMarketer(
    currentUser?.role === "marketer" ? currentUser?.id : null
  );
  const createContract = useCreateContract();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [commissionInput, setCommissionInput] = useState<string>("");
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const [refundWindowInput, setRefundWindowInput] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const hasInitializedDialog = useRef(false);

  // Helper function to get commission percentage
  const getRevSharePercent = useCallback((value?: string | number | null) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return numeric > 1 ? Math.round(numeric) : Math.round(numeric * 100);
  }, []);

  // Get contract status for this project
  const getContractStatus = useCallback(() => {
    const existingContract = contracts.find(
      (contract) => contract.projectId === projectId
    );
    return existingContract?.status;
  }, [contracts, projectId]);

  // Check for query param to auto-open dialog (after data is loaded)
  useEffect(() => {
    if (
      profileData &&
      searchParams?.get("apply") === "true" &&
      isPrivate &&
      currentUser?.role === "marketer" &&
      !hasInitializedDialog.current
    ) {
      hasInitializedDialog.current = true;

      // Check if user is already promoting
      const contractStatus = getContractStatus();

      // Initialize dialog with project data - use setTimeout to avoid setState in effect
      setTimeout(() => {
        // If already approved, just open dialog (will show message)
        // Otherwise, initialize form fields
        if (contractStatus !== "approved") {
          const defaultCommission = getRevSharePercent(
            profileData.project.marketerCommissionPercent
          );
          setCommissionInput(
            defaultCommission !== null ? String(defaultCommission) : ""
          );
          setRefundWindowInput(
            profileData.project.refundWindowDays != null
              ? String(profileData.project.refundWindowDays)
              : "30"
          );
          setApplicationMessage("");
          setFormError(null);
        }
        setIsDialogOpen(true);
      }, 0);
      // Remove query param from URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("apply");
      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [
    profileData,
    searchParams,
    isPrivate,
    currentUser?.role,
    router,
    getRevSharePercent,
    getContractStatus,
  ]);

  // Handle opening the apply dialog
  const handleOpenApply = () => {
    if (!isPrivate) {
      // Public page: redirect to marketer dashboard with query param
      router.push(`/marketer/projects/${projectId}?apply=true`);
      return;
    }

    // Private page: open dialog directly
    if (!profileData?.project) return;

    const defaultCommission = getRevSharePercent(
      profileData.project.marketerCommissionPercent
    );
    setCommissionInput(
      defaultCommission !== null ? String(defaultCommission) : ""
    );
    setRefundWindowInput(
      profileData.project.refundWindowDays != null
        ? String(profileData.project.refundWindowDays)
        : "30"
    );
    setApplicationMessage("");
    setFormError(null);
    setIsDialogOpen(true);
  };

  function getProjectAvatarUrl(name: string, logoUrl?: string | null): string {
    if (logoUrl) return logoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&size=128`;
  }

  // Handle submitting the contract application
  const handleSubmitContract = async () => {
    setFormError(null);
    if (!profileData?.project || !currentUser) return;

    const commissionPercent = Number(commissionInput);
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0) {
      setFormError("Enter a valid commission percent.");
      return;
    }
    const refundWindowDays = refundWindowInput
      ? Number(refundWindowInput)
      : null;
    if (refundWindowDays !== null) {
      if (!Number.isFinite(refundWindowDays) || refundWindowDays < 0) {
        setFormError("Enter a valid refund window in days.");
        return;
      }
    }

    try {
      await createContract.mutateAsync({
        projectId: profileData.project.id,
        userId: currentUser.id,
        commissionPercent,
        message: applicationMessage.trim() || undefined,
        refundWindowDays: refundWindowDays ?? undefined,
      });
      setCommissionInput("");
      setRefundWindowInput("");
      setApplicationMessage("");
      setIsDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit request.";
      setFormError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Project not found
      </div>
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

  // Helper function to check if a value is hidden (-1 means hidden by visibility settings)
  const isHidden = (value: number | null | -1 | undefined): boolean => {
    return value === -1;
  };

  // Helper function to get display value (return null if hidden, otherwise return the value)
  const getDisplayValue = (
    value: number | null | -1 | undefined
  ): number | null => {
    if (isHidden(value)) return null;
    return value ?? null;
  };

  // Show stats section if stats exist (even if values are hidden, we'll blur them)
  const hasStats =
    stats &&
    (stats.activeMarketers !== undefined ||
      stats.totalPurchases !== undefined ||
      stats.avgCommissionPercent !== undefined);

  // Show revenue section if MRR is enabled (showMrr is true) OR if there's actual revenue data
  // This ensures MRR section is always shown when showMrr is true, even if other values are hidden
  const shouldShowRevenueSection =
    stats &&
    (project.showMrr || // MRR is enabled, so show the section
      (stats.totalRevenue !== -1 && (stats.totalRevenue ?? 0) > 0) ||
      (stats.affiliateRevenue !== -1 && (stats.affiliateRevenue ?? 0) > 0) ||
      (stats.mrr !== -1 && (stats.mrr ?? 0) > 0));

  const hasChartData =
    stats &&
    stats.revenueTimeline &&
    stats.revenueTimeline.some((d) => d.total > 0);
  const currency = project.currency?.toUpperCase() || "USD";
  const autoApproveAlert = (() => {
    if (!project.autoApproveApplications) return null;

    const requiresMatchingTerms = project.autoApproveMatchTerms ?? true;
    const requiresVerifiedMarketer = project.autoApproveVerifiedOnly ?? true;
    const commissionPercent = Number(commissionInput);
    const commissionNormalized = Number.isFinite(commissionPercent)
      ? normalizePercent(commissionPercent)
      : null;
    const projectCommission = Number(project.marketerCommissionPercent);
    const hasMatchingCommission =
      commissionNormalized !== null &&
      Number.isFinite(projectCommission) &&
      Math.abs(commissionNormalized - projectCommission) < 0.0001;
    const refundWindowValue = refundWindowInput
      ? Number(refundWindowInput)
      : project.refundWindowDays ?? null;
    const hasMatchingRefundWindow =
      refundWindowValue !== null && refundWindowValue === project.refundWindowDays;
    const hasVerifiedMarketer = Boolean(currentUser?.stripeConnectedAccountId);
    const matchesTerms = hasMatchingCommission && hasMatchingRefundWindow;
    const shouldAutoApprove =
      (!requiresMatchingTerms || matchesTerms) &&
      (!requiresVerifiedMarketer || hasVerifiedMarketer);

    return (
      <Alert variant={shouldAutoApprove ? "default" : "destructive"}>
        <AlertTitle className="text-sm font-semibold">
          {shouldAutoApprove
            ? "This project is auto approving applications."
            : "Auto approval won't apply for this request."}
        </AlertTitle>
        <AlertDescription>
          {requiresMatchingTerms || requiresVerifiedMarketer ? (
            <div className="mt-2 grid gap-2 text-xs">
              {requiresMatchingTerms ? (
                <div className="flex items-center justify-between gap-3">
                  <span>Meets commission and refund window.</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      hasMatchingCommission && hasMatchingRefundWindow
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    {hasMatchingCommission && hasMatchingRefundWindow
                      ? "Matched"
                      : "Not matched"}
                  </span>
                </div>
              ) : null}
              {requiresVerifiedMarketer ? (
                <div className="flex items-center justify-between gap-3">
                  <span>Marketer verified (Stripe connected).</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      hasVerifiedMarketer
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    {hasVerifiedMarketer ? "Verified" : "Not verified"}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm">
              No conditions selected. Your application will auto-approve.
            </p>
          )}
          {!shouldAutoApprove ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Your application will be reviewed by the founder.
            </p>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  })();

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
                isAnonymousName(project.name) ? "blur-xs opacity-60" : ""
              }`}
            >
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
          {/* Category, Website, Launch Date, and Country with icons */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
          {project.description && (
            <p className="text-muted-foreground max-w-3xl">
              {project.description}
            </p>
          )}
        </div>
      ) : (
        // Public header - full hero section with breadcrumbs
        <div className="relative border-b border-border/40 bg-muted/5 pt-24 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-6 pt-0 relative z-10">
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
                    <Link href={basePath}>Projects</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage
                    className={
                      isAnonymousName(project.name) ? "blur-xs opacity-60" : ""
                    }
                  >
                    {project.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex gap-6 items-center">
                {isAnonymousName(project.name) ? (
                  // Show spy icon for GHOST marketers
                  <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-muted border-2 border-border shadow-sm">
                    {getAvatarFallback(
                      project.name,
                      "h-10 w-10 md:h-12 md:w-12"
                    )}
                  </div>
                ) : (
                  <Avatar className="flex h-20 w-20 md:h-24 md:w-24 rounded-lg">
                    <AvatarImage
                      src={getProjectAvatarUrl(project.name, project.logoUrl)}
                      alt={project.name}
                    />
                    <AvatarFallback className="rounded-lg text-sm font-bold">
                      {getAvatarFallback(project.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1
                      className={`text-3xl md:text-4xl font-bold tracking-tight transition-all ${
                        isAnonymousName(project.name)
                          ? "blur-xs opacity-60"
                          : ""
                      }`}
                    >
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

              {currentUser?.role === "marketer" && (
                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                  <Button
                    size="lg"
                    className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-semibold text-base"
                    onClick={handleOpenApply}
                  >
                    Apply to Promote
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Usually responds in 24h
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isPrivate ? "space-y-6" : "mx-auto max-w-7xl px-6 py-6"}>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column: Main Content */}
          <div className="space-y-10">
            {/* Performance Stats & Chart */}
            {shouldShowRevenueSection && stats && (
              <div className="space-y-5">
                {/* Stats Grid - Clean minimal cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Total Revenue Card */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div
                      className={`text-2xl font-semibold mb-1 transition-all ${
                        isHidden(stats.totalRevenue) ? "blur-xs opacity-60" : ""
                      }`}
                    >
                      {getDisplayValue(stats.totalRevenue) != null
                        ? formatCurrency(
                            getDisplayValue(stats.totalRevenue) ?? 0,
                            currency
                          )
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total revenue
                    </div>
                  </div>

                  {/* MRR Card - Always shown if showMrr is true */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div
                      className={`text-2xl font-semibold mb-1 transition-all ${
                        isHidden(stats.mrr) ? "blur-xs opacity-60" : ""
                      }`}
                    >
                      {getDisplayValue(stats.mrr) != null
                        ? formatCurrency(
                            getDisplayValue(stats.mrr) ?? 0,
                            currency
                          )
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      MRR (estimated)
                    </div>
                  </div>

                  {/* Affiliate Revenue Card */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div
                      className={`text-2xl font-semibold mb-1 transition-all ${
                        isHidden(stats.affiliateRevenue)
                          ? "blur-xs opacity-60"
                          : ""
                      }`}
                    >
                      {getDisplayValue(stats.affiliateRevenue) != null
                        ? formatCurrency(
                            getDisplayValue(stats.affiliateRevenue) ?? 0,
                            currency
                          )
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Affiliate revenue
                    </div>
                  </div>

                  {/* Avg Commission Card */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div
                      className={`text-2xl font-semibold mb-1 transition-all ${
                        isHidden(stats.avgPaidCommission)
                          ? "blur-xs opacity-60"
                          : ""
                      }`}
                    >
                      {getDisplayValue(stats.avgPaidCommission) != null
                        ? formatCurrency(
                            getDisplayValue(stats.avgPaidCommission) ?? 0,
                            currency
                          )
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg commission
                    </div>
                  </div>
                </div>
                {/* Revenue Chart - Only show if revenue timeline is not hidden */}
                {hasChartData && stats.revenueTimeline !== null && (
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
                        data={stats.revenueTimeline ?? []}
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

            {/* Rewards Section */}
            <ProjectRewards projectId={projectId} />

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

          {/* Right Column: Key Details & Sidebar */}
          <div className="space-y-6">
            {/* Partnership Details Card */}
            <Card className="border-border/50 top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Partnership Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Stats Row */}
                {hasStats && stats && (
                  <>
                    <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border/40">
                      <div>
                        <div
                          className={`text-2xl font-semibold transition-all ${
                            isHidden(stats.activeMarketers)
                              ? "blur-xs opacity-60"
                              : ""
                          }`}
                        >
                          {getDisplayValue(stats.activeMarketers) != null
                            ? getDisplayValue(stats.activeMarketers)
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Partners
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-2xl font-semibold transition-all ${
                            isHidden(stats.totalPurchases)
                              ? "blur-xs opacity-60"
                              : ""
                          }`}
                        >
                          {getDisplayValue(stats.totalPurchases) != null
                            ? getDisplayValue(stats.totalPurchases)
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sales
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-2xl font-semibold transition-all ${
                            isHidden(stats.avgCommissionPercent)
                              ? "blur-xs opacity-60"
                              : ""
                          }`}
                        >
                          {getDisplayValue(stats.avgCommissionPercent) != null
                            ? `${getDisplayValue(stats.avgCommissionPercent)}%`
                            : commission}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg rate
                        </div>
                      </div>
                    </div>
                    {/* Claimed Rewards Row */}
                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <span className="text-sm text-muted-foreground">
                        Claimed rewards
                      </span>
                      <span
                        className={`text-sm font-semibold transition-all ${
                          isHidden(stats.claimedRewards)
                            ? "blur-xs opacity-60"
                            : ""
                        }`}
                      >
                        {getDisplayValue(stats.claimedRewards) != null
                          ? getDisplayValue(stats.claimedRewards)
                          : "—"}
                      </span>
                    </div>
                  </>
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

                {currentUser?.role === "marketer" && (
                  <Button
                    className="w-full h-11 rounded-xl shadow-md"
                    size="lg"
                    onClick={handleOpenApply}
                    disabled={
                      !currentUser ||
                      getContractStatus() === "approved" ||
                      getContractStatus() === "pending"
                    }
                  >
                    {getContractStatus() === "approved"
                      ? "Already Promoting"
                      : getContractStatus() === "pending"
                      ? "Application Pending"
                      : "Apply Now"}
                  </Button>
                )}
              </CardContent>
            </Card>

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
                        ? `https://unavatar.io/x/${xProfile.handle.replace(
                            /^@/,
                            ""
                          )}`
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
          </div>
        </div>
      </div>

      {/* Apply to Promote Dialog */}
      {currentUser?.role === "marketer" && (
        <ApplyToPromoteDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          projectName={project.name}
          isAlreadyPromoting={getContractStatus() === "approved"}
          commissionInput={commissionInput}
          onCommissionChange={setCommissionInput}
          refundWindowInput={refundWindowInput}
          onRefundWindowChange={setRefundWindowInput}
          applicationMessage={applicationMessage}
          onApplicationMessageChange={setApplicationMessage}
          onSubmit={handleSubmitContract}
          isSubmitting={createContract.isPending}
          submitDisabled={!project}
          formError={formError}
          autoApproveAlert={autoApproveAlert}
        />
      )}
    </div>
  );
}
