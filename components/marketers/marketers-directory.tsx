"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MarketerCard, type MarketerCardData } from "@/components/marketers/marketer-card";
import {
  MarketersFilters,
  type MarketerFilterState,
} from "@/components/marketers/marketers-filters";
import {
  useMarketersSearch,
  useMarketersFilterOptions,
} from "@/lib/hooks/marketer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type MarketersDirectoryProps = {
  /**
   * Whether this is shown in a private dashboard context (with sidebar/header)
   * or public context (with navbar). Affects layout and breadcrumbs.
   */
  isPrivate?: boolean;
  /**
   * Optional custom header title. If not provided, defaults to "Marketers Directory"
   */
  title?: string;
  /**
   * Optional custom header description
   */
  description?: string;
  /**
   * Whether to show breadcrumbs. Defaults to true for public, false for private
   */
  showBreadcrumbs?: boolean;
};

/**
 * Reusable Marketers Directory component that can be used in both public and private contexts.
 * Displays a searchable, filterable grid of marketers with consistent UI.
 */
export function MarketersDirectory({
  isPrivate = false,
  title = "Marketers Directory",
  description = "Discover and connect with top-performing marketers",
  showBreadcrumbs,
}: MarketersDirectoryProps) {
  const [filters, setFilters] = useState<MarketerFilterState>({
    search: "",
    specialties: [],
    earningsRanges: [],
    locations: [],
    focusAreas: [],
  });

  // Fetch marketers with filters from API
  const { data: marketers = [], isLoading, error } = useMarketersSearch({
    search: filters.search || undefined,
    specialties: filters.specialties.length > 0 ? filters.specialties : undefined,
    earningsRanges:
      filters.earningsRanges.length > 0 ? filters.earningsRanges : undefined,
    locations: filters.locations.length > 0 ? filters.locations : undefined,
    focusAreas: filters.focusAreas.length > 0 ? filters.focusAreas : undefined,
  });

  // Fetch available filter options
  const { data: filterOptions } = useMarketersFilterOptions();
  const availableSpecialties = filterOptions?.specialties ?? [];
  const availableLocations = filterOptions?.locations ?? [];
  const availableFocusAreas = filterOptions?.focusAreas ?? [];

  // Convert API response to MarketerCardData format
  const marketerCards: MarketerCardData[] = useMemo(() => {
    return marketers.map((marketer) => ({
      id: marketer.id,
      name: marketer.name,
      bio: marketer.bio,
      avatarUrl: marketer.avatarUrl,
      location: marketer.location,
      specialties: marketer.specialties,
      focusArea: marketer.focusArea,
      totalEarnings: marketer.totalEarnings,
      totalRevenue: marketer.totalRevenue,
      activeProjects: marketer.activeProjects,
      applications: marketer.applications,
      successRate: marketer.successRate,
      clicks30d: marketer.clicks30d,
      installs30d: marketer.installs30d,
      purchases30d: marketer.purchases30d,
    }));
  }, [marketers]);

  // Determine if breadcrumbs should be shown
  const shouldShowBreadcrumbs =
    showBreadcrumbs !== undefined
      ? showBreadcrumbs
      : !isPrivate; // Default: show for public, hide for private

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      {shouldShowBreadcrumbs && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marketers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header - consistent styling for both contexts */}
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className={`${isPrivate ? "" : "mt-2"} text-muted-foreground`}>
          {description}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div
            className={`sticky rounded-lg border border-border/40 bg-muted/10 p-6 ${
              isPrivate ? "top-4" : "top-24"
            }`}
          >
            <MarketersFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableSpecialties={availableSpecialties}
              availableLocations={availableLocations}
              availableFocusAreas={availableFocusAreas}
            />
          </div>
        </aside>

        {/* Marketers Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
              <p className="text-muted-foreground">Loading marketers...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
              <p className="text-muted-foreground">
                Failed to load marketers. Please try again.
              </p>
            </div>
          ) : marketerCards.length === 0 ? (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
              <p className="text-muted-foreground">
                No marketers found matching your criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {marketerCards.length} marketer
                {marketerCards.length !== 1 ? "s" : ""}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {marketerCards.map((marketer) => (
                  <MarketerCard
                    key={marketer.id}
                    marketer={marketer}
                    basePath={isPrivate ? "/founder/discover-marketers" : "/marketers"}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

