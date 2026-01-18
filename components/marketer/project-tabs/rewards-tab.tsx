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
  PAID: { label: "Paid", variant: "secondary" },
};

const getMilestoneCopy = (
  reward: MarketerProjectReward["reward"],
  currency: string,
) => {
  if (reward.milestoneType === "NET_REVENUE") {
    return `${formatCurrency(reward.milestoneValue, currency)} net revenue`;
  }
  if (reward.milestoneType === "COMPLETED_SALES") {
    return `${reward.milestoneValue} completed sales`;
  }
  return `${reward.milestoneValue} customers`;
};

const getRewardCopy = (reward: MarketerProjectReward["reward"], currency: string) => {
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
  if (reward.rewardType === "MONEY") {
    return formatCurrency(reward.rewardAmount ?? 0, reward.rewardCurrency ?? currency);
  }
  return "Access / perk";
};

const renderEarnedAt = (value?: string | Date | null) => {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  const date = new Date(value);
  return (
    <div className="flex flex-col items-end text-right leading-tight">
      <span className="text-black">{date.toLocaleDateString()}</span>
      <span className="text-xs text-muted-foreground">
        {date.toLocaleTimeString()}
      </span>
    </div>
  );
};

export function MarketerRewardsTab({
  rewards,
  isLoading,
  currency,
  marketerId,
  onClaimReward,
  isClaiming,
  claimError,
}: {
  rewards: MarketerProjectReward[];
  isLoading: boolean;
  currency: string;
  marketerId?: string | null;
  onClaimReward: (rewardEarnedId: string) => Promise<void>;
  isClaiming: boolean;
  claimError?: string | null;
}) {
  const earnedRewards = useMemo(
    () =>
      rewards.flatMap((item) => {
        const earnedList = item.earnedList?.length
          ? item.earnedList
          : item.earned
            ? [item.earned]
            : [];
        return earnedList
          .filter((earned) => earned.status !== "PENDING_REFUND")
          .map((earned) => ({
            reward: item.reward,
            earned,
          }));
      }).sort((a, b) => {
        const aTime = new Date(a.earned.earnedAt).getTime();
        const bTime = new Date(b.earned.earnedAt).getTime();
        return bTime - aTime;
      }),
    [rewards],
  );
  const activeRewards = useMemo(
    () =>
      rewards.filter((item) => {
        if (item.reward.status !== "ACTIVE") return false;
        const allowed = Array.isArray(item.reward.allowedMarketerIds)
          ? item.reward.allowedMarketerIds
          : [];
        if (allowed.length === 0) return true;
        if (!marketerId) return false;
        return allowed.includes(marketerId);
      }),
    [marketerId, rewards],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Performance Rewards</h2>
        <p className="text-sm text-muted-foreground">
          Earn additional rewards by hitting revenue milestones after refunds clear.
          For repeatable rewards, progress resets after each milestone.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading rewards...
          </CardContent>
        </Card>
      ) : activeRewards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No rewards available yet for this project.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {activeRewards.map((item) => {
            const badge = statusLabel[item.status];
            const progressPercent = Math.max(
              0,
              Math.min(item.progress.percent, 100),
            );
            const canClaim =
              item.status === "UNLOCKED" &&
              item.earned?.id &&
              item.earned.status === "UNLOCKED" &&
              item.reward.rewardType !== "MONEY";
            const isClaimed = item.status === "CLAIMED";
            const rewardCode = item.earned?.rewardCoupon?.code ?? null;

            return (
              <Card key={item.reward.id} className="flex flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{item.reward.name}</CardTitle>
                      <p className="text-muted-foreground">
                        Unlock at: {getMilestoneCopy(item.reward, currency)}
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

                  <div className="text-muted-foreground">
                    Reward:{" "}
                    <span className="text-foreground">
                      {getRewardCopy(item.reward, currency)}
                    </span>
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
                  <TableRow key={item.earned.id}>
                    <TableCell className="font-medium">{item.reward.name}</TableCell>
                    <TableCell>{getMilestoneCopy(item.reward, currency)}</TableCell>
                    <TableCell>{getRewardCopy(item.reward, currency)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.earned.status === "PAID"
                          ? "Paid"
                          : item.earned.status === "CLAIMED"
                            ? "Claimed"
                            : "Unlocked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {renderEarnedAt(item.earned.earnedAt)}
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
