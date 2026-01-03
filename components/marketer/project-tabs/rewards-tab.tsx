"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/data/metrics";
import type { MarketerProjectReward } from "@/lib/hooks/marketer";

const statusLabel: Record<
  MarketerProjectReward["status"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  IN_PROGRESS: { label: "In progress", variant: "outline" },
  PENDING_REFUND: { label: "Pending refund window", variant: "secondary" },
  UNLOCKED: { label: "Unlocked", variant: "default" },
  CLAIMED: { label: "Claimed", variant: "secondary" },
};

const getMilestoneCopy = (reward: MarketerProjectReward["reward"]) => {
  if (reward.milestoneType === "NET_REVENUE") {
    return `${reward.milestoneValue} net revenue`;
  }
  if (reward.milestoneType === "COMPLETED_SALES") {
    return `${reward.milestoneValue} completed sales`;
  }
  return `${reward.milestoneValue} customers`;
};

const getRewardCopy = (reward: MarketerProjectReward["reward"]) => {
  if (reward.rewardType === "DISCOUNT_COUPON") {
    return `${reward.rewardPercentOff ?? 0}% discount`;
  }
  if (reward.rewardType === "FREE_SUBSCRIPTION") {
    const months = reward.rewardDurationMonths ?? 1;
    return `Free ${months} month${months === 1 ? "" : "s"}`;
  }
  if (reward.rewardType === "PLAN_UPGRADE") {
    return "Plan upgrade";
  }
  return "Access / perk";
};

export function MarketerRewardsTab({
  rewards,
  isLoading,
  currency,
  onClaimReward,
  isClaiming,
  claimError,
}: {
  rewards: MarketerProjectReward[];
  isLoading: boolean;
  currency: string;
  onClaimReward: (rewardEarnedId: string) => Promise<void>;
  isClaiming: boolean;
  claimError?: string | null;
}) {
  const earnedRewards = useMemo(
    () =>
      rewards.filter(
        (item) => item.earned && item.earned.status !== "PENDING_REFUND",
      ),
    [rewards],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Performance Rewards</h2>
        <p className="text-sm text-muted-foreground">
          Earn additional rewards by hitting revenue milestones after refunds clear.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading rewards...
          </CardContent>
        </Card>
      ) : rewards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No rewards available yet for this project.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {rewards.map((item) => {
            const badge = statusLabel[item.status];
            const progressPercent = Math.max(
              0,
              Math.min(item.progress.percent, 100),
            );
            const canClaim =
              item.status === "UNLOCKED" &&
              item.earned?.id &&
              item.earned.status === "UNLOCKED";
            const isClaimed = item.status === "CLAIMED";
            const rewardCode = item.earned?.rewardCoupon?.code ?? null;

            return (
              <Card key={item.reward.id} className="flex flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{item.reward.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Unlock at: {getMilestoneCopy(item.reward)}
                      </p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {item.reward.milestoneType === "NET_REVENUE"
                          ? formatCurrency(item.progress.current, currency)
                          : item.progress.current}
                        {" / "}
                        {item.reward.milestoneType === "NET_REVENUE"
                          ? formatCurrency(item.progress.goal, currency)
                          : item.progress.goal}
                      </span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Reward: <span className="text-foreground">{getRewardCopy(item.reward)}</span>
                  </div>

                  {rewardCode ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      Promo code: <span className="font-medium">{rewardCode}</span>
                    </div>
                  ) : null}

                  {canClaim ? (
                    <Button
                      disabled={isClaiming}
                      onClick={() => onClaimReward(item.earned!.id)}
                      className="w-full"
                    >
                      {isClaiming ? "Claiming..." : "Claim reward"}
                    </Button>
                  ) : isClaimed ? (
                    <Button variant="secondary" disabled className="w-full">
                      Claimed
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {claimError ? (
        <p className="text-sm text-destructive">{claimError}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earned Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {earnedRewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rewards earned yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Reward Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnedRewards.map((item) => (
                  <TableRow key={item.reward.id}>
                    <TableCell className="font-medium">{item.reward.name}</TableCell>
                    <TableCell>{getMilestoneCopy(item.reward)}</TableCell>
                    <TableCell>{getRewardCopy(item.reward)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.status === "CLAIMED" ? "Claimed" : "Unlocked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.earned?.earnedAt
                        ? new Date(item.earned.earnedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
