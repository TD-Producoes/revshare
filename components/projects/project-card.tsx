"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Globe, MapPin } from "lucide-react";
import { getAvatarFallback, isAnonymousName } from "@/lib/utils/anonymous";

export type ProjectCardData = {
  id: string;
  name: string;
  description?: string | null;
  category: string | null;
  logoUrl?: string | null;
  country?: string | null;
  website?: string | null;
  revenue: number | null; // Can be null when revenue is hidden
  marketers: number | null; // Can be null when stats are hidden
  commission: number;
  applications?: number;
  creatorName?: string | null;
};

type ProjectCardProps = {
  project: ProjectCardData;
  /**
   * Base path for the project link (e.g., "/projects" for public, "/marketer/projects" for dashboard)
   * Defaults to "/projects"
   */
  basePath?: string;
};

function formatCurrency(value: number | null): string {
  if (value === null) return "Hidden";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getProjectAvatarUrl(name: string, logoUrl?: string | null): string {
  if (logoUrl) return logoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;
}

export function ProjectCard({
  project,
  basePath = "/projects",
}: ProjectCardProps) {
  return (
    <Link href={`${basePath}/${project.id}`}>
      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
        <CardContent className="p-6 py-2 flex flex-col h-full">
          {/* Main Content */}
          <div className="flex-1">
            {/* Logo/Image Section */}
            <div className="mb-3 flex h-16 w-16 items-center justify-center">
            {isAnonymousName(project.name) ? (
                // Show spy icon for GHOST marketers
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted border-2 border-border">
                  {getAvatarFallback(project.name, "h-8 w-8")}
                </div>
              ) : (
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarImage
                  src={getProjectAvatarUrl(project.name, project.logoUrl)}
                  alt={project.name}
                />
                  <AvatarFallback className="rounded-lg text-sm font-bold">
                    {getAvatarFallback(project.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Name */}
            <h3 
              className={`mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-all ${
                isAnonymousName(project.name) ? "blur-xs opacity-60" : ""
              }`}
            >
              {project.name}
            </h3>

            {/* Category Badge */}
            {project.category && (
              <div className="mb-3">
                <Badge variant="secondary">{project.category}</Badge>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {project.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{project.country}</span>
                </div>
              )}
              {project.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{formatCurrency(project.revenue)} revenue</span>
              </div>
              {project.creatorName ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 opacity-0" />
                  <span className="truncate">by {project.creatorName}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {project.marketers === null ? "Hidden" : project.marketers}
              </span>{" "}
              marketers
              {typeof project.applications === "number" ? (
                <>
                  <span className="mx-2 opacity-50">•</span>
                  <span className="font-medium text-foreground">
                    {project.applications}
                  </span>{" "}
                  applications
                </>
              ) : null}
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {project.commission}% commission
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

