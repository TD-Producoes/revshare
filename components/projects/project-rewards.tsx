"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Target, Sparkles, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock reward type matching the Prisma schema
type MockReward = {
  id: string;
  name: string;
  description?: string | null;
  milestoneType: "NET_REVENUE" | "COMPLETED_SALES" | "ACTIVE_CUSTOMERS";
  milestoneValue: number;
  rewardType: "DISCOUNT_COUPON" | "FREE_SUBSCRIPTION" | "PLAN_UPGRADE" | "ACCESS_PERK";
  rewardLabel?: string | null;
  rewardPercentOff?: number | null;
  rewardDurationMonths?: number | null;
  fulfillmentType: "AUTO_COUPON" | "MANUAL";
  earnLimit: "ONCE_PER_MARKETER" | "MULTIPLE";
  availabilityType: "UNLIMITED" | "FIRST_N";
  availabilityLimit?: number | null;
};

/**
 * Formats milestone value based on type
 */
function formatMilestone(reward: MockReward): string {
  if (reward.milestoneType === "NET_REVENUE") {
    return `$${reward.milestoneValue.toLocaleString()} net revenue`;
  }
  if (reward.milestoneType === "COMPLETED_SALES") {
    return `${reward.milestoneValue} completed sale${reward.milestoneValue !== 1 ? "s" : ""}`;
  }
  return `${reward.milestoneValue} active customer${reward.milestoneValue !== 1 ? "s" : ""}`;
}

/**
 * Gets the icon for milestone type
 */
function getMilestoneIcon(milestoneType: MockReward["milestoneType"]) {
  switch (milestoneType) {
    case "NET_REVENUE":
      return TrendingUp;
    case "COMPLETED_SALES":
      return CheckCircle2;
    case "ACTIVE_CUSTOMERS":
      return Users;
    default:
      return Target;
  }
}

/**
 * Formats reward description based on type
 */
function formatRewardDescription(reward: MockReward): string {
  if (reward.rewardType === "DISCOUNT_COUPON") {
    const percent = reward.rewardPercentOff ?? 0;
    const duration = reward.rewardDurationMonths
      ? ` for ${reward.rewardDurationMonths} month${reward.rewardDurationMonths !== 1 ? "s" : ""}`
      : "";
    return `${percent}% discount${duration}`;
  }
  if (reward.rewardType === "FREE_SUBSCRIPTION") {
    const duration = reward.rewardDurationMonths
      ? `${reward.rewardDurationMonths} month${reward.rewardDurationMonths !== 1 ? "s" : ""}`
      : "subscription";
    return `Free ${duration}`;
  }
  if (reward.rewardType === "PLAN_UPGRADE") {
    return reward.rewardLabel || "Plan upgrade";
  }
  return reward.rewardLabel || "Access / perk";
}

/**
 * Formats availability information
 */
function formatAvailability(reward: MockReward): string {
  if (reward.availabilityType === "FIRST_N" && reward.availabilityLimit) {
    return `First ${reward.availabilityLimit} marketer${reward.availabilityLimit !== 1 ? "s" : ""}`;
  }
  return "Unlimited";
}

/**
 * Formats earn limit information
 */
function formatEarnLimit(earnLimit: MockReward["earnLimit"]): string {
  return earnLimit === "ONCE_PER_MARKETER" ? "Once per marketer" : "Can be earned multiple times";
}

/**
 * Project Rewards Component
 * Displays available rewards for a project to incentivize marketers
 */
export function ProjectRewards({ projectId }: { projectId: string }) {
  // Mock data - will be replaced with API call later
  const mockRewards: MockReward[] = [
    {
      id: "1",
      name: "Free Pro (1 month)",
      description: "Get a free month of Pro plan after generating your first $1,000 in net revenue.",
      milestoneType: "NET_REVENUE",
      milestoneValue: 1000,
      rewardType: "FREE_SUBSCRIPTION",
      rewardDurationMonths: 1,
      fulfillmentType: "AUTO_COUPON",
      earnLimit: "ONCE_PER_MARKETER",
      availabilityType: "UNLIMITED",
    },
    {
      id: "2",
      name: "50% Off Annual Plan",
      description: "Earn a 50% discount coupon for the annual plan after reaching $5,000 in net revenue.",
      milestoneType: "NET_REVENUE",
      milestoneValue: 5000,
      rewardType: "DISCOUNT_COUPON",
      rewardPercentOff: 50,
      rewardDurationMonths: 12,
      fulfillmentType: "AUTO_COUPON",
      earnLimit: "ONCE_PER_MARKETER",
      availabilityType: "FIRST_N",
      availabilityLimit: 10,
    },
    {
      id: "3",
      name: "Lifetime Plan Upgrade",
      description: "Upgrade to lifetime plan after generating $10,000 in net revenue. Limited to first 5 marketers.",
      milestoneType: "NET_REVENUE",
      milestoneValue: 10000,
      rewardType: "PLAN_UPGRADE",
      rewardLabel: "Lifetime Plan",
      fulfillmentType: "MANUAL",
      earnLimit: "ONCE_PER_MARKETER",
      availabilityType: "FIRST_N",
      availabilityLimit: 5,
    },
    {
      id: "4",
      name: "Early Access to Beta Features",
      description: "Get exclusive access to new beta features after completing 25 sales.",
      milestoneType: "COMPLETED_SALES",
      milestoneValue: 25,
      rewardType: "ACCESS_PERK",
      rewardLabel: "Beta Access",
      fulfillmentType: "MANUAL",
      earnLimit: "MULTIPLE",
      availabilityType: "UNLIMITED",
    },
  ];

  // Filter to only show active, public rewards (in real implementation, this would come from API)
  const availableRewards = mockRewards;

  if (availableRewards.length === 0) {
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
        {availableRewards.map((reward) => {
          const MilestoneIcon = getMilestoneIcon(reward.milestoneType);
          const rewardDescription = formatRewardDescription(reward);
          const milestoneText = formatMilestone(reward);
          const availabilityText = formatAvailability(reward);
          const earnLimitText = formatEarnLimit(reward.earnLimit);

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

