"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/projects/project-card";
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

type ProjectsDirectoryProps = {
  /**
   * Whether this is shown in a private dashboard context (with sidebar/header)
   * or public context (with navbar). Affects layout and breadcrumbs.
   */
  isPrivate?: boolean;
  /**
   * Optional custom header title. If not provided, defaults to "Projects Directory"
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
  /**
   * Base path for project links (e.g., "/projects" for public, "/marketer/projects" for dashboard)
   * Defaults to "/projects"
   */
  basePath?: string;
};

/**
 * Reusable Projects Directory component that can be used in both public and private contexts.
 * Displays a searchable, filterable grid of projects with consistent UI.
 */
export function ProjectsDirectory({
  isPrivate = false,
  title = "Projects Directory",
  description = "Discover and explore projects available for partnership",
  showBreadcrumbs,
  basePath = "/projects",
}: ProjectsDirectoryProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    revenueRanges: [],
    commissionRanges: [],
    countries: [],
  });

  // Fetch projects with filters from API
  const {
    data: projects = [],
    isLoading,
    error,
  } = useProjectsSearch({
    search: filters.search || undefined,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    revenueRanges:
      filters.revenueRanges.length > 0 ? filters.revenueRanges : undefined,
    commissionRanges:
      filters.commissionRanges.length > 0
        ? filters.commissionRanges
        : undefined,
    countries: filters.countries.length > 0 ? filters.countries : undefined,
  });

  // Fetch available filter options
  const { data: filterOptions } = useProjectsFilterOptions();
  const availableCategories = filterOptions?.categories ?? [];
  const availableCountries = filterOptions?.countries ?? [];

  // Convert API response to ProjectCardData format
  const projectCards = useMemo<ProjectCardData[]>(() => {
    return projects.map(
      (project): ProjectCardData => ({
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
      })
    );
  }, [projects]);

  // Determine if breadcrumbs should be shown
  const shouldShowBreadcrumbs =
    showBreadcrumbs !== undefined ? showBreadcrumbs : !isPrivate;

  return (
    <div className="space-y-8">
      {/* Breadcrumb - only shown in public context by default */}
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
              <BreadcrumbPage>Projects</BreadcrumbPage>
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
                  <ProjectCard
                    key={project.id}
                    project={project}
                    basePath={basePath}
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
