"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, Target } from "lucide-react";
import { PreviewMarketer } from "@/lib/data/preview-data";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

interface PreviewMarketerCardProps {
  marketer: PreviewMarketer;
}

export function PreviewMarketerCard({ marketer }: PreviewMarketerCardProps) {
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
              {/* Avatar Section */}
              <div className="mb-3 flex h-16 w-16 items-center justify-center">
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarFallback className="rounded-lg text-sm font-bold">
                    {marketer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name */}
              <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-all">
                {marketer.name}
              </h3>

              {/* Specialties Badges */}
              {marketer.promotionTypes && marketer.promotionTypes.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {marketer.promotionTypes.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {marketer.promotionTypes.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{marketer.promotionTypes.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm text-muted-foreground">
                {marketer.industries && marketer.industries[0] && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="truncate">{marketer.industries[0]}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Shown after launch</span>
                </div>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Launching soon</span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              >
                Visible after launch
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
        source="marketer-card-preview"
      />
    </>
  );
}
