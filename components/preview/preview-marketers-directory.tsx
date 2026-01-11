"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PreviewMarketerCard } from "@/components/preview/preview-marketer-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { previewMarketers } from "@/lib/data/preview-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type PreviewMarketersDirectoryProps = {
  isPrivate?: boolean;
  title?: string;
  description?: string;
  showBreadcrumbs?: boolean;
};

const specialtyOptions = [
  "Content Marketing",
  "SEO",
  "Paid Ads",
  "Social Media",
  "YouTube",
  "Video Content",
  "Newsletter",
  "Email Marketing",
];

const industryOptions = [
  "SaaS",
  "Developer Tools",
  "E-commerce",
  "DTC Brands",
  "Tech",
  "Productivity",
  "Finance",
  "Startups",
];

export function PreviewMarketersDirectory({
  isPrivate = false,
  title = "Marketers Directory",
  description = "Discover and connect with top-performing marketers",
  showBreadcrumbs,
}: PreviewMarketersDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Filter marketers based on search and filters
  const filteredMarketers = useMemo(() => {
    return previewMarketers.filter((marketer) => {
      const matchesSearch =
        searchQuery === "" ||
        marketer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marketer.bio.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty =
        selectedSpecialties.length === 0 ||
        selectedSpecialties.some((specialty) =>
          marketer.promotionTypes.includes(specialty)
        );

      const matchesIndustry =
        selectedIndustries.length === 0 ||
        selectedIndustries.some((industry) =>
          marketer.industries.includes(industry)
        );

      return matchesSearch && matchesSpecialty && matchesIndustry;
    });
  }, [searchQuery, selectedSpecialties, selectedIndustries]);

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };

  // Determine if breadcrumbs should be shown
  const shouldShowBreadcrumbs =
    showBreadcrumbs !== undefined ? showBreadcrumbs : !isPrivate;

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
              RevShare is launching soon. See how marketer profiles will look and discover verified partners when we launch.
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
                    placeholder="Search marketers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Specialties</Label>
                <div className="space-y-2.5">
                  {specialtyOptions.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${specialty}`}
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyToggle(specialty)}
                      />
                      <label
                        htmlFor={`specialty-${specialty}`}
                        className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {specialty}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Industries</Label>
                <div className="space-y-2.5">
                  {industryOptions.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <Checkbox
                        id={`industry-${industry}`}
                        checked={selectedIndustries.includes(industry)}
                        onCheckedChange={() => handleIndustryToggle(industry)}
                      />
                      <label
                        htmlFor={`industry-${industry}`}
                        className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {industry}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Marketers Grid */}
        <div className="flex-1">
          {filteredMarketers.length === 0 ? (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-12 text-center">
              <p className="text-muted-foreground">
                No marketers found matching your criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredMarketers.length} marketer
                {filteredMarketers.length !== 1 ? "s" : ""}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMarketers.map((marketer) => (
                  <PreviewMarketerCard key={marketer.id} marketer={marketer} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
