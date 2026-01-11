"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { useProjectRewards } from "@/lib/hooks/projects";

/**
 * Project Rewards Component
 * Displays available rewards for a project to incentivize marketers
 */
export function ProjectRewards({ projectId }: { projectId: string }) {
  // Fetch rewards from API using React Query
  const { data: rewards = [], isLoading, error } = useProjectRewards(projectId);

  // Show nothing if loading, error, or no rewards
  if (isLoading) {
    return null; // Or you could show a loading skeleton
  }

  if (error || rewards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Available Rewards
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Earn milestone-based rewards as you generate revenue for this project.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rewards.map((reward) => {
          return (
            <Card
              key={reward.id}
              className="group hover:shadow-lg transition-all hover:border-primary/50"
            >
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      {reward.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {reward.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {reward.description}
                  </p>
                )}

                {/* Milestone Section */}
                {/* <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/40">
                  <div className="shrink-0 mt-0.5">
                    <MilestoneIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Milestone
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {milestoneText}
                    </div>
                  </div>
                </div> */}

                {/* Reward Details */}
                {/* <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Reward
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {rewardDescription}
                  </div>
                </div> */}

                {/* Additional Info */}
                {/* <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {availabilityText}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {earnLimitText}
                  </Badge>
                  {reward.fulfillmentType === "AUTO_COUPON" && (
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Auto-delivered
                    </Badge>
                  )}
                </div> */}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

