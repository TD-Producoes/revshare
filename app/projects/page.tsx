"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ProjectCard, type ProjectCardData } from "@/components/projects/project-card";
import {
  ProjectsFilters,
  type FilterState,
} from "@/components/projects/projects-filters";
import {
  useProjectsSearch,
  useProjectsFilterOptions,
} from "@/lib/hooks/projects";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ProjectsDirectoryPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    revenueRanges: [],
    commissionRanges: [],
    countries: [],
  });

  // Fetch projects with filters from API
  const { data: projects = [], isLoading, error } = useProjectsSearch({
    search: filters.search || undefined,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    revenueRanges:
      filters.revenueRanges.length > 0 ? filters.revenueRanges : undefined,
    commissionRanges:
      filters.commissionRanges.length > 0 ? filters.commissionRanges : undefined,
    countries: filters.countries.length > 0 ? filters.countries : undefined,
  });

  // Fetch available filter options
  const { data: filterOptions } = useProjectsFilterOptions();
  const availableCategories = filterOptions?.categories ?? [];
  const availableCountries = filterOptions?.countries ?? [];

  // Convert API response to ProjectCardData format
  const projectCards: ProjectCardData[] = useMemo(() => {
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      category: project.category,
      logoUrl: project.logoUrl,
      country: project.country,
      website: project.website,
      revenue: project.revenue,
      marketers: project.marketers,
      commission: project.commission,
    }));
  }, [projects]);

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
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Projects Directory</h1>
          <p className="mt-2 text-muted-foreground">
            Discover and explore projects available for partnership
          </p>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-lg border border-border/40 bg-muted/10 p-6">
              <ProjectsFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableCategories={availableCategories}
                availableCountries={availableCountries}
              />
            </div>
          </aside>

          {/* Projects Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
                <p className="text-muted-foreground">
                  Failed to load projects. Please try again.
                </p>
              </div>
            ) : projectCards.length === 0 ? (
              <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
                <p className="text-muted-foreground">
                  No projects found matching your criteria.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {projectCards.length} project
                  {projectCards.length !== 1 ? "s" : ""}
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projectCards.map((project) => (
                    <ProjectCard key={project.id} project={project} />
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

