"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Globe } from "lucide-react";
import { PreviewProject } from "@/lib/data/preview-data";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

interface PreviewProjectCardProps {
  project: PreviewProject;
}

export function PreviewProjectCard({ project }: PreviewProjectCardProps) {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsWaitlistOpen(true)}
        className="cursor-pointer"
      >
        <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50 relative">
          {/* Example badge */}
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-border/40 bg-background">
              Example
            </Badge>
          </div>

          <CardContent className="p-6 py-2 flex flex-col h-full">
            {/* Main Content */}
            <div className="flex-1">
              {/* Logo/Image Section */}
              <div className="mb-3 flex h-16 w-16 items-center justify-center">
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarFallback className="rounded-lg text-sm font-bold">
                    {project.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name */}
              <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-all">
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
                {project.pricingModel && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{project.pricingModel}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Shown after launch</span>
                </div>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Launching soon</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {project.commissionPercent}% commission
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
        source="project-card-preview"
      />
    </>
  );
}
