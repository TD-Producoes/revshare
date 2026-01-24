"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { MarketerPurchasesTab } from "@/components/marketer/project-tabs/purchases-tab";
import { MarketerPromoCodesTab } from "@/components/marketer/project-tabs/promo-codes-tab";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useAttributionLink, useProject } from "@/lib/hooks/projects";
import { useContractsForMarketer } from "@/lib/hooks/contracts";
import {
  useClaimCoupon,
  useCouponsForMarketer,
  useProjectCouponTemplates,
} from "@/lib/hooks/coupons";
import {
  useMarketerAdjustments,
  useMarketerMetrics,
  useMarketerPurchases,
  useMarketerProjectRewards,
} from "@/lib/hooks/marketer";
import { MarketerRewardsTab } from "@/components/marketer/project-tabs/rewards-tab";
import { MarketerProjectOverviewTab } from "@/components/marketer/project-tabs/overview-tab";
import { MarketerProjectMetricsTab } from "@/components/marketer/project-tabs/metrics-tab";

interface MarketerProjectDetailProps {
  projectId: string;
}

export function MarketerProjectDetail({ projectId }: MarketerProjectDetailProps) {
  const params = useParams<{ projectId?: string }>();
  const resolvedProjectId =
    projectId ||
    (typeof params?.projectId === "string" ? params.projectId : null);
  const queryClient = useQueryClient();
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: project, isLoading: isProjectLoading } =
    useProject(resolvedProjectId);
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);
  const { data: purchases = [], isLoading: isPurchasesLoading } =
    useMarketerPurchases(currentUser?.id);
  const { data: adjustmentsPayload, isLoading: isAdjustmentsLoading } =
    useMarketerAdjustments(currentUser?.id);
  const adjustments = adjustmentsPayload?.data ?? [];
  const { data: coupons = [], isLoading: isCouponsLoading } =
    useCouponsForMarketer(currentUser?.id);
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useMarketerMetrics(currentUser?.id, resolvedProjectId);
  const {
    data: rewardItems = [],
    isLoading: isRewardsLoading,
  } = useMarketerProjectRewards(resolvedProjectId, currentUser?.id);
  const { data: templates = [], isLoading: isTemplatesLoading } =
    useProjectCouponTemplates(resolvedProjectId, false, currentUser?.id);
  const claimCoupon = useClaimCoupon();

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const { data: attributionLink, error: attributionError } = useAttributionLink(
    resolvedProjectId,
  );

  const isLoading =
    isAuthLoading ||
    isUserLoading ||
    isProjectLoading ||
    isContractsLoading ||
    isPurchasesLoading ||
    isCouponsLoading ||
    isMetricsLoading ||
    isTemplatesLoading ||
    isAdjustmentsLoading ||
    isRewardsLoading;

  const projectPurchases = useMemo(
    () =>
      resolvedProjectId
        ? purchases.filter((purchase) => purchase.projectId === resolvedProjectId)
        : [],
    [purchases, resolvedProjectId],
  );

  const projectCoupons = useMemo(
    () =>
      resolvedProjectId
        ? coupons.filter((coupon) => coupon.projectId === resolvedProjectId)
        : [],
    [coupons, resolvedProjectId],
  );

  const projectAdjustments = useMemo(
    () =>
      resolvedProjectId
        ? adjustments.filter((adjustment) => adjustment.projectId === resolvedProjectId)
        : [],
    [adjustments, resolvedProjectId],
  );

  const contract = contracts.find(
    (item) => item.projectId === resolvedProjectId,
  );

  const attributionUrl = attributionLink?.url ?? "";
  const attributionErrorMessage =
    attributionError instanceof Error
      ? attributionError.message
      : attributionError
        ? "Failed to load attribution link."
        : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGeneratePromo = async () => {
    if (!currentUser || !selectedTemplateId || !resolvedProjectId) return;
    setPromoError(null);
    try {
      await claimCoupon.mutateAsync({
        projectId: resolvedProjectId,
        templateId: selectedTemplateId,
        marketerId: currentUser.id,
        code: customCode.trim() || undefined,
      });
      setCustomCode("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate promo code.";
      setPromoError(message);
      throw error;
    }
  };

  const handleClaimReward = async (rewardEarnedId: string) => {
    if (!currentUser) return;
    setClaimError(null);
    setIsClaiming(true);
    try {
      const response = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardEarnedId,
          marketerId: currentUser.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to claim reward.");
      }
      await queryClient.invalidateQueries({
        queryKey: [
          "marketer-project-rewards",
          resolvedProjectId ?? "none",
          currentUser.id,
        ],
      });
    } catch (error) {
      setClaimError(
        error instanceof Error ? error.message : "Failed to claim reward.",
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const getPurchaseStatusBadge = (status: string, commissionStatus: string) => {
    if (commissionStatus === "refunded") {
      return <Badge variant="destructive">Refunded</Badge>;
    }
    if (commissionStatus === "chargeback") {
      return <Badge variant="destructive">Chargeback</Badge>;
    }
    return (
      <Badge variant="outline" className="capitalize">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "marketer") {
    return (
      <div className="text-muted-foreground">
        This section is only available to marketers.
      </div>
    );
  }

  if (!resolvedProjectId) {
    return <div className="text-xs text-muted-foreground">Project not found.</div>;
  }

  if (!project) {
    return (
      <div className="text-xs text-muted-foreground">Project not found.</div>
    );
  }

  if (metricsError) {
    return (
      <div className="text-xs text-muted-foreground">
        {metricsError instanceof Error
          ? metricsError.message
          : "Unable to load project metrics."}
      </div>
    );
  }

  const commissionPercent =
    contract?.commissionPercent != null
      ? contract.commissionPercent > 1
        ? Math.round(contract.commissionPercent)
        : Math.round(contract.commissionPercent * 100)
      : null;
  const projectCurrency =
    typeof project.currency === "string" ? project.currency : "USD";
  const hasStoreUrls = Boolean(project.appStoreUrl || project.playStoreUrl);

  const metricsSummary = metrics?.summary ?? {
    projectRevenue: 0,
    affiliateRevenue: 0,
    commissionOwed: 0,
    purchasesCount: 0,
    customersCount: 0,
    clicksCount: 0,
    installsCount: 0,
  };
  const combinedTimeline = metrics?.timeline ?? [];
  const affiliateSummary = metricsSummary;
  const affiliateShare =
    affiliateSummary.projectRevenue > 0
      ? Math.round(
          (affiliateSummary.affiliateRevenue / affiliateSummary.projectRevenue) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketer/applications" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to applications
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Track performance and manage promo codes for this project.
            </p>
          </div>
        </div>
        {commissionPercent !== null ? (
          <Badge variant="secondary">{commissionPercent}% commission</Badge>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger className="px-3 py-2 text-sm" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="metrics">
              Metrics
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="rewards">
              Rewards
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="purchases">
              Purchases
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="promo-codes">
              Promo Codes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <MarketerProjectOverviewTab
            attributionUrl={attributionUrl}
            attributionErrorMessage={attributionErrorMessage}
            hasStoreUrls={hasStoreUrls}
            onCopyLink={handleCopy}
            metricsSummary={affiliateSummary}
            affiliateShare={affiliateShare}
            projectCurrency={projectCurrency}
            projectAdjustments={projectAdjustments}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <MarketerProjectMetricsTab
            timeline={combinedTimeline}
            clicksTotal={affiliateSummary.clicksCount}
            installsTotal={affiliateSummary.installsCount}
            currency={projectCurrency}
            projectId={resolvedProjectId ?? null}
            projectName={project.name}
          />
        </TabsContent>

        <TabsContent value="purchases">
          <MarketerPurchasesTab
            purchases={projectPurchases}
            currency={projectCurrency}
            getStatusBadge={getPurchaseStatusBadge}
          />
        </TabsContent>

        <TabsContent value="promo-codes">
          <MarketerPromoCodesTab
            templates={templates}
            coupons={projectCoupons}
            selectedTemplateId={selectedTemplateId}
            customCode={customCode}
            promoError={promoError}
            onTemplateChange={(value) => {
              setSelectedTemplateId(value);
              setPromoError(null);
            }}
            onCustomCodeChange={setCustomCode}
            onGenerate={handleGeneratePromo}
            onCopy={handleCopy}
          />
        </TabsContent>

        <TabsContent value="rewards">
          <MarketerRewardsTab
            rewards={rewardItems}
            isLoading={isRewardsLoading}
            currency={projectCurrency}
            marketerId={currentUser?.id}
            onClaimReward={handleClaimReward}
            isClaiming={isClaiming}
            claimError={claimError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
