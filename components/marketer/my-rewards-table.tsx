"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/data/metrics";
import { MarketerProjectReward } from "@/lib/hooks/marketer";
import { Gift, Check, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

interface MyRewardsTableProps {
  rewards: MarketerProjectReward[];
}

export function MyRewardsTable({ rewards }: MyRewardsTableProps) {
  if (rewards.length === 0) {
    return null;
  }

  // Filter out paid/claimed for "Active" view if needed, 
  // but usually "Active Rewards" section implies ongoing ones.
  const statusPriority: Record<MarketerProjectReward["status"], number> = {
    IN_PROGRESS: 0,
    PENDING_REFUND: 1,
    UNLOCKED: 2,
    CLAIMED: 3,
    PAID: 4,
  };

  const activeRewards = [...rewards]
    .filter((item) => item.status !== "PAID" && item.status !== "CLAIMED")
    .sort((a, b) => {
      const priorityDelta = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDelta !== 0) return priorityDelta;
      return b.progress.percent - a.progress.percent;
    });

  if (activeRewards.length === 0) {
    return null;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reward</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Milestone</TableHead>
          <TableHead className="w-[200px]">Progress</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeRewards.map((item) => {
          const progressPercent = Math.max(0, Math.min(item.progress.percent, 100));
          const reward = item.reward as any;

          const renderStatusBadge = (status: string) => {
            switch (status) {
              case "UNLOCKED":
                return (
                  <Badge variant="success" className="gap-1">
                    <Check className="size-3 text-emerald-600" />
                    Unlocked
                  </Badge>
                );
              case "IN_PROGRESS":
                return (
                  <Badge variant="outline" className="gap-1">
                    <Loader2 className="size-3 text-muted-foreground animate-spin" />
                    In Progress
                  </Badge>
                );
              default:
                return (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    {status.replace("_", " ")}
                  </Badge>
                );
            }
          };

          return (
            <TableRow key={item.reward.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary shrink-0" />
                  <span>{item.reward.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/marketer/applications/${reward.projectId}`}
                  className="text-muted-foreground hover:underline"
                >
                  {reward.projectName}
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">
                  {item.reward.milestoneType === "NET_REVENUE"
                    ? formatCurrency(item.progress.goal, reward.currency || "USD")
                    : item.reward.milestoneType === "COMPLETED_SALES"
                      ? `${item.progress.goal} completed sales`
                      : item.reward.milestoneType === "CLICKS"
                        ? `${item.progress.goal} clicks`
                        : `${item.progress.goal} installs`}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {renderStatusBadge(item.status)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
