"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/data/metrics";
import { useProjectMarketers, useRewards } from "@/lib/hooks/projects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  ChevronsUpDown,
  Gift,
  MoreHorizontal,
  ShieldCheck,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type RewardStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

type Reward = {
  id: string;
  name: string;
  description?: string | null;
  milestoneType: "NET_REVENUE" | "COMPLETED_SALES" | "ACTIVE_CUSTOMERS";
  milestoneValue: number;
  startsAt?: string | null;
  rewardType:
    | "DISCOUNT_COUPON"
    | "FREE_SUBSCRIPTION"
    | "PLAN_UPGRADE"
    | "ACCESS_PERK"
    | "MONEY";
  rewardPercentOff?: number | null;
  rewardDurationMonths?: number | null;
  rewardAmount?: number | null;
  rewardCurrency?: string | null;
  allowedMarketerIds?: string[] | null;
  fulfillmentType: "AUTO_COUPON" | "MANUAL";
  earnLimit: "ONCE_PER_MARKETER" | "MULTIPLE";
  availabilityType: "UNLIMITED" | "FIRST_N";
  availabilityLimit?: number | null;
  visibility: "PUBLIC" | "PRIVATE";
  status: RewardStatus;
};

const statusLabels: Record<RewardStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
};

const statusBadge: Record<RewardStatus, string> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  PAUSED: "outline",
  ARCHIVED: "secondary",
};

const getMilestoneLabel = (reward: Reward, currency: string) => {
  if (reward.milestoneType === "NET_REVENUE") {
    return `${formatCurrency(reward.milestoneValue, currency)} net revenue`;
  }
  if (reward.milestoneType === "COMPLETED_SALES") {
    return `${reward.milestoneValue} completed sales`;
  }
  return `${reward.milestoneValue} active customers`;
};

const getRewardTypeLabel = (reward: Reward, currency: string) => {
  if (reward.rewardType === "DISCOUNT_COUPON") return "Discount coupon";
  if (reward.rewardType === "FREE_SUBSCRIPTION") return "Free subscription period";
  if (reward.rewardType === "PLAN_UPGRADE") return "Plan upgrade";
  if (reward.rewardType === "MONEY") {
    return `Cash reward ${formatCurrency(
      reward.rewardAmount ?? 0,
      reward.rewardCurrency ?? currency,
    )}`;
  }
  return "Access / perk";
};

const getAvailabilityLabel = (reward: Reward) =>
  reward.availabilityType === "FIRST_N" && reward.availabilityLimit
    ? `First ${reward.availabilityLimit} marketers`
    : "Unlimited";

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function ProjectRewardsTab({
  projectId,
  creatorId,
  projectCurrency,
  autoOpenCreate,
  onAutoOpenHandled,
}: {
  projectId: string;
  creatorId?: string | null;
  projectCurrency?: string | null;
  autoOpenCreate?: boolean;
  onAutoOpenHandled?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [marketersOpen, setMarketersOpen] = useState(false);
  const queryClient = useQueryClient();
  const rewardsQueryKey = useMemo(
    () => ["rewards", projectId ?? "none", "all"],
    [projectId],
  );
  const {
    data: rewards = [],
    isLoading: isRewardsLoading,
    error: rewardsError,
  } = useRewards({
    projectId,
    includeAll: true,
    enabled: Boolean(creatorId),
  });
  const { data: projectMarketers = [], isLoading: isMarketersLoading } =
    useProjectMarketers(projectId);
  const marketerOptions = useMemo(
    () =>
      projectMarketers.map((marketer) => ({
        id: marketer.id,
        label: marketer.name?.trim() || marketer.email,
      })),
    [projectMarketers],
  );
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    milestoneType: "NET_REVENUE",
    milestoneValue: "",
    startsAt: "",
    rewardType: "DISCOUNT_COUPON",
    rewardPercentOff: "100",
    rewardDurationMonths: "1",
    rewardAmount: "",
    fulfillmentType: "AUTO_COUPON",
    earnLimit: "ONCE_PER_MARKETER",
    availabilityType: "UNLIMITED",
    availabilityLimit: "",
    visibility: "PUBLIC",
    allowedMarketerIds: [] as string[],
    confirm: false,
  });

  const totals = useMemo(() => {
    const active = rewards.filter((reward) => reward.status === "ACTIVE").length;
    const draft = rewards.filter((reward) => reward.status === "DRAFT").length;
    const paused = rewards.filter((reward) => reward.status === "PAUSED").length;
    return { active, draft, paused };
  }, [rewards]);

  const rewardLabel =
    formState.rewardType === "DISCOUNT_COUPON"
      ? `${formState.rewardPercentOff || 0}% discount`
      : formState.rewardType === "FREE_SUBSCRIPTION"
        ? `Free ${formState.rewardDurationMonths || 1} month${
            formState.rewardDurationMonths === "1" ? "" : "s"
          }`
        : formState.rewardType === "PLAN_UPGRADE"
          ? "Plan upgrade"
          : formState.rewardType === "MONEY"
            ? formatCurrency(
                Math.round((Number(formState.rewardAmount) || 0) * 100),
                projectCurrency ?? "USD",
              )
          : "Access / perk";

  const resetForm = () => {
    setFormState({
      name: "",
      description: "",
      milestoneType: "NET_REVENUE",
      milestoneValue: "",
      startsAt: "",
      rewardType: "DISCOUNT_COUPON",
      rewardPercentOff: "100",
      rewardDurationMonths: "1",
      rewardAmount: "",
      fulfillmentType: "AUTO_COUPON",
      earnLimit: "ONCE_PER_MARKETER",
      availabilityType: "UNLIMITED",
      availabilityLimit: "",
      visibility: "PUBLIC",
      allowedMarketerIds: [],
      confirm: false,
    });
    setCreateError(null);
  };

  useEffect(() => {
    if (!rewardsError) {
      setLoadError(null);
      return;
    }
    setLoadError(
      rewardsError instanceof Error
        ? rewardsError.message
        : "Failed to load rewards.",
    );
  }, [rewardsError]);

  const handleCreate = async () => {
    if (!creatorId) return;
    if (!formState.name.trim()) return;
    if (!formState.milestoneValue) return;
    if (formState.rewardType === "MONEY" && !formState.rewardAmount) return;
    if (!formState.confirm) return;
    setCreateError(null);
    setIsCreating(true);

    try {
      const milestoneValue =
        formState.milestoneType === "NET_REVENUE"
          ? Math.round((Number(formState.milestoneValue) || 0) * 100)
          : Number(formState.milestoneValue);
      const rewardAmount =
        formState.rewardType === "MONEY"
          ? Math.round((Number(formState.rewardAmount) || 0) * 100)
          : undefined;
      const response = await fetch(`/api/projects/${projectId}/rewards`, {
        method: editingRewardId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          rewardId: editingRewardId ?? undefined,
          name: formState.name,
          description: formState.description || undefined,
          milestoneType: formState.milestoneType,
          milestoneValue,
          startsAt: formState.startsAt || undefined,
          rewardType: formState.rewardType,
          rewardPercentOff:
            formState.rewardType === "DISCOUNT_COUPON"
              ? Number(formState.rewardPercentOff)
              : undefined,
          rewardDurationMonths:
            formState.rewardType === "FREE_SUBSCRIPTION"
              ? Number(formState.rewardDurationMonths)
              : undefined,
          rewardAmount,
          fulfillmentType:
            formState.rewardType === "MONEY"
              ? "MANUAL"
              : formState.fulfillmentType,
          earnLimit: formState.earnLimit,
          availabilityType: formState.availabilityType,
          availabilityLimit: formState.availabilityLimit
            ? Number(formState.availabilityLimit)
            : undefined,
          visibility: formState.visibility,
          allowedMarketerIds:
            formState.allowedMarketerIds.length > 0
              ? formState.allowedMarketerIds
              : [],
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to create reward.");
      }

      await queryClient.invalidateQueries({ queryKey: rewardsQueryKey });
      setIsOpen(false);
      setEditingRewardId(null);
      resetForm();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create reward.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openCreate = () => {
    setEditingRewardId(null);
    resetForm();
    setIsOpen(true);
  };

  const openEdit = (rewardId: string) => {
    const reward = rewards.find((item) => item.id === rewardId);
    if (!reward) return;
    setEditingRewardId(rewardId);
    setFormState({
      name: reward.name,
      description: reward.description ?? "",
      milestoneType: reward.milestoneType,
      milestoneValue:
        reward.milestoneType === "NET_REVENUE"
          ? String(Math.round((reward.milestoneValue ?? 0) / 100))
          : String(reward.milestoneValue),
      startsAt: formatDateForInput(reward.startsAt),
      rewardType: reward.rewardType,
      rewardPercentOff: reward.rewardPercentOff
        ? String(reward.rewardPercentOff)
        : "100",
      rewardDurationMonths: reward.rewardDurationMonths
        ? String(reward.rewardDurationMonths)
        : "1",
      rewardAmount:
        reward.rewardType === "MONEY"
          ? String(Math.round((reward.rewardAmount ?? 0) / 100))
          : "",
      fulfillmentType: reward.fulfillmentType,
      earnLimit: reward.earnLimit,
      availabilityType: reward.availabilityType,
      availabilityLimit: reward.availabilityLimit
        ? String(reward.availabilityLimit)
        : "",
      visibility: reward.visibility,
      allowedMarketerIds: Array.isArray(reward.allowedMarketerIds)
        ? reward.allowedMarketerIds
        : [],
      confirm: true,
    });
    setIsOpen(true);
  };

  const updateStatus = async (rewardId: string, status: RewardStatus) => {
    if (!creatorId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/rewards`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          rewardId,
          status,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to update reward.");
      }
      await queryClient.invalidateQueries({ queryKey: rewardsQueryKey });
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to update reward.",
      );
    }
  };

  useEffect(() => {
    if (!autoOpenCreate || !creatorId) return;
    openCreate();
    onAutoOpenHandled?.();
  }, [autoOpenCreate, creatorId, onAutoOpenHandled]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rewards & Milestones</h2>
          <p className="text-sm text-muted-foreground">
            Incentivize long-term performance with milestone-based rewards.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!creatorId}>
          Create reward
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active rewards"
          value={String(totals.active)}
          description="Currently available"
          icon={Gift}
        />
        <StatCard
          title="Draft rewards"
          value={String(totals.draft)}
          description="Not yet published"
          icon={Target}
        />
        <StatCard
          title="Paused rewards"
          value={String(totals.paused)}
          description="Temporarily unavailable"
          icon={ShieldCheck}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold">Rewards list</h3>
        {isRewardsLoading ? (
          <p className="text-muted-foreground">Loading rewards...</p>
        ) : rewards.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No rewards yet. Create a milestone reward to motivate marketers.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reward</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Reward Type</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell className="font-medium">{reward.name}</TableCell>
                  <TableCell>
                    {getMilestoneLabel(reward, projectCurrency ?? "USD")}
                  </TableCell>
                  <TableCell>
                    {getRewardTypeLabel(reward, projectCurrency ?? "USD")}
                  </TableCell>
                  <TableCell>{getAvailabilityLabel(reward)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusBadge[reward.status] as "default" | "secondary" | "outline"}
                      className={cn(reward.status === "ACTIVE" && "capitalize")}
                    >
                      {statusLabels[reward.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Reward actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(reward.id)}>
                          Edit
                        </DropdownMenuItem>
                        {reward.status !== "ACTIVE" ? (
                          <DropdownMenuItem
                            onClick={() => updateStatus(reward.id, "ACTIVE")}
                          >
                            Activate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateStatus(reward.id, "PAUSED")}
                          >
                            Pause
                          </DropdownMenuItem>
                        )}
                        {reward.status !== "ARCHIVED" ? (
                          <DropdownMenuItem
                            onClick={() => updateStatus(reward.id, "ARCHIVED")}
                          >
                            Archive
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {loadError ? (
          <p className="text-sm text-destructive mt-3">{loadError}</p>
        ) : null}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingRewardId ? "Edit reward" : "Create reward"}
            </DialogTitle>
            <DialogDescription>
              Configure a milestone reward that unlocks after refunds clear.
            </DialogDescription>
          </DialogHeader>
          {createError ? (
            <p className="text-sm text-destructive">{createError}</p>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="rewardName">Reward name</Label>
              <Input
                id="rewardName"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Free Pro (1 month)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardDescription">Description</Label>
              <Textarea
                id="rewardDescription"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional notes shown to marketers."
              />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">Milestone</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Milestone type</Label>
                  <Select
                    value={formState.milestoneType}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, milestoneType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NET_REVENUE">
                        Net revenue generated
                      </SelectItem>
                      <SelectItem value="COMPLETED_SALES">
                        Number of completed sales
                      </SelectItem>
                      <SelectItem value="ACTIVE_CUSTOMERS">
                        Active customers after X days
                      </SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestoneValue">Threshold</Label>
                <Input
                    id="milestoneValue"
                    type="number"
                    min={1}
                    value={formState.milestoneValue}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        milestoneValue: event.target.value,
                      }))
                    }
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardStartsAt">Starts on</Label>
                <Input
                  id="rewardStartsAt"
                  type="date"
                  value={formState.startsAt}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      startsAt: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to start counting from today.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Milestones are evaluated after the refund window ends.
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">Reward</p>
              <div className="space-y-2">
                <Label>Reward type</Label>
                <Select
                  value={formState.rewardType}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      rewardType: value,
                      fulfillmentType: value === "MONEY" ? "MANUAL" : prev.fulfillmentType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT_COUPON">
                      Discount coupon
                    </SelectItem>
                    <SelectItem value="FREE_SUBSCRIPTION">
                      Free subscription period
                    </SelectItem>
                    <SelectItem value="PLAN_UPGRADE">
                      Plan upgrade
                    </SelectItem>
                    <SelectItem value="ACCESS_PERK">Access / perk</SelectItem>
                    <SelectItem value="MONEY">Cash reward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formState.rewardType === "DISCOUNT_COUPON" ? (
                <div className="space-y-2">
                  <Label htmlFor="rewardPercentOff">Discount percent</Label>
                  <Input
                    id="rewardPercentOff"
                    type="number"
                    min={1}
                    max={100}
                    value={formState.rewardPercentOff}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        rewardPercentOff: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {formState.rewardType === "FREE_SUBSCRIPTION" ? (
                <div className="space-y-2">
                  <Label htmlFor="rewardDurationMonths">Duration (months)</Label>
                  <Input
                    id="rewardDurationMonths"
                    type="number"
                    min={1}
                    value={formState.rewardDurationMonths}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        rewardDurationMonths: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {formState.rewardType === "MONEY" ? (
                <div className="space-y-2">
                  <Label htmlFor="rewardAmount">
                    Cash reward ({(projectCurrency ?? "USD").toUpperCase()})
                  </Label>
                  <Input
                    id="rewardAmount"
                    type="number"
                    min={1}
                    value={formState.rewardAmount}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        rewardAmount: event.target.value,
                      }))
                    }
                    placeholder="100"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Fulfillment</Label>
                <Select
                  value={formState.fulfillmentType}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, fulfillmentType: value }))
                  }
                  disabled={formState.rewardType === "MONEY"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO_COUPON">
                      Coupon auto-generated
                    </SelectItem>
                    <SelectItem value="MANUAL">
                      Manual fulfillment (requires confirmation)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formState.rewardType === "MONEY"
                    ? "Cash rewards are paid manually after the refund window."
                    : "Auto coupons are delivered instantly. Manual fulfillment is for perks outside Stripe."}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">Constraints</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Reward can be earned</Label>
                  <Select
                    value={formState.earnLimit}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, earnLimit: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE_PER_MARKETER">
                        Once per marketer
                      </SelectItem>
                      <SelectItem value="MULTIPLE">
                        Multiple times
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select
                    value={formState.availabilityType}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        availabilityType: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                      <SelectItem value="FIRST_N">
                        First N marketers
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formState.availabilityType === "FIRST_N" ? (
                <div className="space-y-2">
                  <Label htmlFor="availabilityLimit">Availability limit</Label>
                  <Input
                    id="availabilityLimit"
                    type="number"
                    min={1}
                    value={formState.availabilityLimit}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        availabilityLimit: event.target.value,
                      }))
                    }
                    placeholder="10"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Marketers</Label>
                <Popover open={marketersOpen} onOpenChange={setMarketersOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={marketersOpen}
                      className="w-full justify-between"
                      disabled={isMarketersLoading}
                    >
                      {formState.allowedMarketerIds.length === 0
                        ? "All marketers"
                        : formState.allowedMarketerIds.length === 1
                          ? marketerOptions.find(
                              (item) =>
                                item.id === formState.allowedMarketerIds[0],
                            )?.label ?? "1 marketer selected"
                          : `${formState.allowedMarketerIds.length} marketers selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search marketers..." />
                      <CommandList>
                        <CommandEmpty>No marketers found.</CommandEmpty>
                        <CommandGroup>
                          {marketerOptions.map((marketer) => {
                            const isSelected =
                              formState.allowedMarketerIds.includes(
                                marketer.id,
                              );
                            return (
                              <CommandItem
                                key={marketer.id}
                                value={marketer.label}
                                onSelect={() => {
                                  setFormState((prev) => {
                                    const alreadySelected =
                                      prev.allowedMarketerIds.includes(
                                        marketer.id,
                                      );
                                    return {
                                      ...prev,
                                      allowedMarketerIds: alreadySelected
                                        ? prev.allowedMarketerIds.filter(
                                            (id) => id !== marketer.id,
                                          )
                                        : [
                                            ...prev.allowedMarketerIds,
                                            marketer.id,
                                          ],
                                    };
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "ml-2 mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {marketer.label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow all approved marketers.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={formState.visibility}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private (invite-only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-semibold">Confirmation</p>
              <div className="text-sm text-muted-foreground">
                <p>
                  Milestone:{" "}
                  <span className="text-foreground">
                    {formState.milestoneType === "NET_REVENUE"
                      ? `${formatCurrency(
                          Math.round((Number(formState.milestoneValue) || 0) * 100),
                          projectCurrency ?? "USD",
                        )} net revenue`
                      : formState.milestoneType === "COMPLETED_SALES"
                        ? `${formState.milestoneValue || 0} completed sales`
                        : `${formState.milestoneValue || 0} active customers`}
                  </span>
                </p>
                <p>
                  Reward:{" "}
                  <span className="text-foreground">
                    {rewardLabel}
                  </span>
                </p>
                <p>
                  Availability:{" "}
                  <span className="text-foreground">
                    {formState.availabilityType === "FIRST_N" &&
                    formState.availabilityLimit
                      ? `First ${formState.availabilityLimit} marketers`
                      : "Unlimited"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rewardConfirm"
                  checked={formState.confirm}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({
                      ...prev,
                      confirm: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="rewardConfirm" className="text-xs">
                  I understand this reward becomes claimable once the milestone
                  is reached and refunds clear.
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formState.confirm || isCreating}
            >
              {editingRewardId ? "Save changes" : "Create reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
