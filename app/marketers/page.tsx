"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
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

export default function MarketersDirectoryPage() {
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
    }));
  }, [marketers]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl pt-24 px-6 py-8">
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
              <BreadcrumbPage>Marketers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Marketers Directory</h1>
          <p className="mt-2 text-muted-foreground">
            Discover and connect with top-performing marketers
          </p>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-lg border border-border/40 bg-muted/10 p-6">
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
                    <MarketerCard key={marketer.id} marketer={marketer} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

