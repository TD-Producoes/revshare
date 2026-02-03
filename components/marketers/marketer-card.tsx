"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, MapPin, Target } from "lucide-react";
import { getAvatarFallback, isAnonymousName } from "@/lib/utils/anonymous";

export type MarketerCardData = {
  id: string;
  name: string | null; // null in GHOST mode
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  specialties?: string[];
  focusArea?: string | null;
  totalEarnings: number | null;
  totalRevenue: number | null;
  activeProjects: number;
  applications?: number;
  successRate?: number; // 0..1
  clicks30d?: number;
  installs30d?: number;
  purchases30d?: number;
};

type MarketerCardProps = {
  marketer: MarketerCardData;
  basePath?: string; // Base path for marketer links (e.g., "/marketers" for public, "/founder/discover-marketers" for dashboard)
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

function getMarketerAvatarUrl(name: string | null, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  if (!name) return `https://ui-avatars.com/api/?name=??&background=random&size=128`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;
}


export function MarketerCard({ marketer, basePath = "/marketers" }: MarketerCardProps) {
  return (
    <Link href={`${basePath}/${marketer.id}`}>
      <Card className="group h-full transition-all hover:border-primary/50">
        <CardContent className="p-6 py-2 flex flex-col h-full">
          {/* Main Content */}
          <div className="flex-1">
            {/* Avatar Section */}
            <div className="mb-3 flex h-16 w-16 items-center justify-center">
              {isAnonymousName(marketer.name) ? (
                // Show spy icon for GHOST marketers
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted border-2 border-border">
                  {getAvatarFallback(marketer.name, "h-8 w-8")}
                </div>
              ) : (
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarImage
                    src={getMarketerAvatarUrl(marketer.name, marketer.avatarUrl)}
                    alt={marketer.name || "Anonymous"}
                  />
                  <AvatarFallback className="rounded-lg text-sm font-bold">
                    {getAvatarFallback(marketer.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Name */}
            <h3 
              className={`mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-all ${
                isAnonymousName(marketer.name) ? "blur-xs opacity-60" : ""
              }`}
            >
              {marketer.name ?? "Anonymous Marketer"}
            </h3>

            {/* Specialties Badges */}
            {marketer.specialties && marketer.specialties.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {marketer.specialties.slice(0, 2).map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {marketer.specialties.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{marketer.specialties.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {marketer.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{marketer.location}</span>
                </div>
              )}
              {marketer.focusArea && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="truncate">{marketer.focusArea}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(marketer.totalEarnings)} earned</span>
              </div>
              {typeof marketer.applications === "number" && typeof marketer.successRate === "number" ? (
                <div className="text-xs text-muted-foreground">
                  {marketer.applications} applications • {Math.round(marketer.successRate * 100)}% approved
                </div>
              ) : null
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {marketer.activeProjects}
              </span>{" "}
              {marketer.activeProjects === 1 ? "project" : "projects"}
              {typeof marketer.clicks30d === "number" ? (
                <>
                  <span className="mx-2 opacity-50">•</span>
                  <span className="font-medium text-foreground">{marketer.clicks30d}</span>{" "}
                  clicks (30d)
                </>
              ) : null}
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            >
              {formatCurrency(marketer.totalRevenue)} revenue
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

