"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PreviewProjectCard } from "@/components/preview/preview-project-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { previewProjects, previewCategories, commissionRanges } from "@/lib/data/preview-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type PreviewProjectsDirectoryProps = {
  isPrivate?: boolean;
  title?: string;
  description?: string;
  showBreadcrumbs?: boolean;
};

export function PreviewProjectsDirectory({
  isPrivate = false,
  title = "Projects Directory",
  description = "Discover and explore projects available for partnership",
  showBreadcrumbs,
}: PreviewProjectsDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCommissionRanges, setSelectedCommissionRanges] = useState<string[]>([]);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return previewProjects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(project.category);

      const matchesCommission =
        selectedCommissionRanges.length === 0 ||
        selectedCommissionRanges.some((rangeLabel) => {
          const range = commissionRanges.find((r) => r.label === rangeLabel);
          if (!range) return false;
          return (
            project.commissionPercent >= range.min &&
            project.commissionPercent <= range.max
          );
        });

      return matchesSearch && matchesCategory && matchesCommission;
    });
  }, [searchQuery, selectedCategories, selectedCommissionRanges]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleCommissionToggle = (rangeLabel: string) => {
    setSelectedCommissionRanges((prev) =>
      prev.includes(rangeLabel)
        ? prev.filter((r) => r !== rangeLabel)
        : [...prev, rangeLabel]
    );
  };

  // Determine if breadcrumbs should be shown
  const shouldShowBreadcrumbs =
    showBreadcrumbs !== undefined ? showBreadcrumbs : !isPrivate;

  // Get available filter options (exclude "All Categories" for checkboxes)
  const categoryOptions = previewCategories.filter((c) => c !== "All Categories");
  const commissionOptions = commissionRanges.filter((r) => r.label !== "All Commissions");

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

      {/* Preview Banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex items-start gap-3">
          <Badge className="bg-amber-500 text-white border-none font-bold text-[10px] uppercase tracking-widest mt-0.5">
            Preview
          </Badge>
          <div>
            <p className="text-sm font-medium text-amber-900">
              Marketplace Preview
            </p>
            <p className="text-sm text-amber-800 mt-0.5">
              RevShare is launching soon. Explore example programs and see how discovery will work.
            </p>
          </div>
        </div>
      </div>

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
            <div className="space-y-6">
              {/* Search */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Category</Label>
                <div className="space-y-2.5">
                  {categoryOptions.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Commission</Label>
                <div className="space-y-2.5">
                  {commissionOptions.map((range) => (
                    <div key={range.label} className="flex items-center space-x-2">
                      <Checkbox
                        id={`commission-${range.label}`}
                        checked={selectedCommissionRanges.includes(range.label)}
                        onCheckedChange={() => handleCommissionToggle(range.label)}
                      />
                      <label
                        htmlFor={`commission-${range.label}`}
                        className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {range.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Projects Grid */}
        <div className="flex-1">
          {filteredProjects.length === 0 ? (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
              <p className="text-muted-foreground">
                No projects found matching your criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <PreviewProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
