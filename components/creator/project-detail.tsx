"use client";

import { ProjectActivityTab } from "@/components/creator/project-tabs/activity-tab";
import { ProjectCouponsTab } from "@/components/creator/project-tabs/coupons-tab";
import { ProjectMarketersTab } from "@/components/creator/project-tabs/marketers-tab";
import { ProjectMetricsTab } from "@/components/creator/project-tabs/metrics-tab";
import { ProjectOverviewTab } from "@/components/creator/project-tabs/overview-tab";
import { ProjectRewardsTab } from "@/components/creator/project-tabs/rewards-tab";
import { ProjectSettingsTab } from "@/components/creator/project-tabs/settings-tab";
import { AttributionKeysSetup } from "@/components/creator/attribution-keys-setup";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRevenueTimeline } from "@/lib/data/metrics";
import { useEvents, useProjects } from "@/lib/data/store";
import { Project } from "@/lib/data/types";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useProjectCoupons, useProjectCouponTemplates } from "@/lib/hooks/coupons";
import {
  useProject,
  useProjectMetrics,
  useProjectMarketers,
  useProjectPurchases,
  useProjectAttributionClicks,
} from "@/lib/hooks/projects";
import { useUser } from "@/lib/hooks/users";
import { cn } from "@/lib/utils";
import { VisibilityMode } from "@prisma/client";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "../ui/badge";

interface ProjectDetailProps {
  projectId: string;
}

function buildAffiliateRows(
  projectCoupons: Array<{
    code: string;
    marketer: { id: string; name: string };
    refundWindowDays?: number | null;
  }>,
  projectPurchases: Array<{
    amount: number;
    commissionAmount: number;
    coupon: { marketer: { id: string } } | null;
    marketer: { id: string } | null;
  }>,
  approvedMarketers: Array<{ id: string; name: string }>,
  marketerClicks: Map<string, number>,
  marketerInstalls: Map<string, number>,
) {
  const couponMap = new Map<
    string,
    { marketerId: string; marketerName: string; codes: string[]; refundWindowDays?: number | null }
  >();

  projectCoupons.forEach((coupon) => {
    const marketerId = coupon.marketer.id;
    const existing = couponMap.get(marketerId) ?? {
      marketerId,
      marketerName: coupon.marketer.name,
      codes: [] as string[],
      refundWindowDays: coupon.refundWindowDays,
    };
    existing.codes.push(coupon.code);
    couponMap.set(marketerId, existing);
  });

  const purchaseMap = new Map<
    string,
    { purchases: number; revenue: number; commission: number }
  >();
  projectPurchases.forEach((purchase) => {
    const marketerId =
      purchase.coupon?.marketer?.id ?? purchase.marketer?.id ?? null;
    if (!marketerId) return;
    const existing = purchaseMap.get(marketerId) ?? {
      purchases: 0,
      revenue: 0,
      commission: 0,
    };
    existing.purchases += 1;
    existing.revenue += purchase.amount;
    existing.commission += purchase.commissionAmount;
    purchaseMap.set(marketerId, existing);
  });

  const marketerIds = new Set<string>([
    ...approvedMarketers.map((marketer) => marketer.id),
    ...couponMap.keys(),
    ...purchaseMap.keys(),
    ...marketerClicks.keys(),
    ...marketerInstalls.keys(),
  ]);

  const marketerNameMap = new Map(
    approvedMarketers.map((marketer) => [marketer.id, marketer.name]),
  );

  return Array.from(marketerIds).map((marketerId) => {
    const couponInfo = couponMap.get(marketerId);
    const purchaseInfo = purchaseMap.get(marketerId);
    const codes = couponInfo?.codes ?? [];
    const codeLabel =
      codes.length > 1 ? `${codes[0]} (+${codes.length - 1})` : codes[0] ?? "-";

    return {
      marketerId,
      marketerName:
        couponInfo?.marketerName ??
        marketerNameMap.get(marketerId) ??
        "Unknown",
      referralCode: codeLabel,
      purchases: purchaseInfo?.purchases ?? 0,
      revenue: purchaseInfo?.revenue ?? 0,
      commission: purchaseInfo?.commission ?? 0,
      clicks: marketerClicks.get(marketerId) ?? 0,
      installs: marketerInstalls.get(marketerId) ?? 0,
      refundWindowDays: couponInfo?.refundWindowDays ?? null,
    };
  });
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const projects = useProjects();
  const events = useEvents();
  const [connectError, setConnectError] = useState("");
  const { data: authUserId } = useAuthUserId();
  const { data: currentUser } = useUser(authUserId);
  const queryClient = useQueryClient();
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isDeletingTemplateId, setIsDeletingTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMarketers, setIsLoadingMarketers] = useState(false);
  const [productOptions, setProductOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [marketerOptions, setMarketerOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [productsOpen, setProductsOpen] = useState(false);
  const [marketersOpen, setMarketersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [shouldOpenReward, setShouldOpenReward] = useState(false);
  const [isRevenueCatDialogOpen, setIsRevenueCatDialogOpen] = useState(false);
  const [revenueCatProjectId, setRevenueCatProjectId] = useState("");
  const [revenueCatApiKey, setRevenueCatApiKey] = useState("");
  const [revenueCatWebhookSecret, setRevenueCatWebhookSecret] = useState("");
  const [revenueCatError, setRevenueCatError] = useState<string | null>(null);
  const [revenueCatWebhookError, setRevenueCatWebhookError] = useState<string | null>(null);
  const [revenueCatWebhookStatus, setRevenueCatWebhookStatus] = useState<string | null>(null);
  const [isSavingRevenueCat, setIsSavingRevenueCat] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isDisconnectingRevenueCat, setIsDisconnectingRevenueCat] = useState(false);
  const [isStripeDisconnectDialogOpen, setIsStripeDisconnectDialogOpen] = useState(false);
  const [isDisconnectingStripe, setIsDisconnectingStripe] = useState(false);
  const [isCreatingRevenueCatWebhook, setIsCreatingRevenueCatWebhook] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    percentOff: "10",
    durationType: "ONCE",
    durationInMonths: "",
    startAt: "",
    endAt: "",
    maxRedemptions: "",
    productIds: [] as string[],
    allowedMarketerIds: [] as string[],
  });

  const { data: apiProject, isLoading } = useProject(projectId);
  const { data: projectMetrics } = useProjectMetrics(projectId, 30);
  const {
    data: projectPurchases = [],
    isLoading: isPurchasesLoading,
    error: purchasesError,
  } = useProjectPurchases(projectId);
  const {
    data: projectCoupons = [],
    isLoading: isCouponsLoading,
    error: couponsError,
  } = useProjectCoupons(projectId);
  const { data: projectMarketers = [], isLoading: isMarketersLoading } =
    useProjectMarketers(projectId);
  const { data: attributionClicks } = useProjectAttributionClicks(projectId);
  const {
    data: couponTemplates = [],
    isLoading: isTemplatesLoading,
    error: templatesError,
  } = useProjectCouponTemplates(projectId, true);
  const isStripeConnected = Boolean(apiProject?.creatorStripeAccountId);
  const isRevenueCatConnected = Boolean(
    apiProject?.revenueCatConnected || apiProject?.revenueCatProjectId,
  );
  const shouldShowStripeConnect = !isRevenueCatConnected;
  const shouldShowRevenueCatConnect = !isStripeConnected;
  const projectCurrency =
    typeof apiProject?.currency === "string" ? apiProject.currency : "USD";
  const webhookUrl =
    typeof window !== "undefined" && apiProject?.revenueCatProjectId
      ? `${window.location.origin}/api/revenuecat/webhook/${apiProject.revenueCatProjectId}`
      : "";
  const activeTabLabel = {
    overview: "Overview",
    metrics: "Metrics",
    coupons: "Coupons",
    marketers: "Marketers",
    rewards: "Rewards",
    activity: "Activity",
    attribution: "Attribution",
    settings: "Settings",
  }[activeTab] ?? "Overview";
  const searchParams = useSearchParams();
  const handledCreateRef = useRef<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;
    const allowedTabs = new Set([
      "overview",
      "metrics",
      "coupons",
      "marketers",
      "rewards",
      "activity",
      "attribution",
      "settings",
    ]);
    if (allowedTabs.has(tab)) {
      setActiveTab(tab);
    }
    const createParam = searchParams.get("create");
    if (createParam && allowedTabs.has(tab)) {
      const createKey = `${projectId}:${createParam}`;
      if (handledCreateRef.current !== createKey) {
        handledCreateRef.current = createKey;
        if (createParam === "coupon") {
          setEditingTemplateId(null);
          setIsTemplateOpen(true);
        }
        if (createParam === "reward") {
          setShouldOpenReward(true);
        }
      }
    }
  }, [searchParams, projectId]);

  useEffect(() => {
    setRevenueCatProjectId(apiProject?.revenueCatProjectId ?? "");
  }, [apiProject?.revenueCatProjectId]);

  useEffect(() => {
    if (!isTemplateOpen) {
      return;
    }
    let isActive = true;
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/products`);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load products.");
        }
        const products = payload?.data?.products ?? [];
        const options = products.map((product: { id: string; name: string }) => ({
          id: product.id,
          name: product.name,
        }));
        if (isActive) {
          setProductOptions(options);
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof Error ? error.message : "Failed to load products.";
          setTemplateError(message);
        }
      } finally {
        if (isActive) {
          setIsLoadingProducts(false);
        }
      }
    };

    const loadMarketers = async () => {
      setIsLoadingMarketers(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/marketers`);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load marketers.");
        }
        const marketers = payload?.data ?? [];
        const options = marketers.map(
          (marketer: { id: string; name: string | null; email: string }) => ({
            id: marketer.id,
            label: marketer.name?.trim() || marketer.email,
          }),
        );
        if (isActive) {
          setMarketerOptions(options);
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof Error ? error.message : "Failed to load marketers.";
          setTemplateError(message);
        }
      } finally {
        if (isActive) {
          setIsLoadingMarketers(false);
        }
      }
    };

    void loadProducts();
    void loadMarketers();

    return () => {
      isActive = false;
    };
  }, [isTemplateOpen, projectId]);

  const project = projects.find((p) => p.id === projectId);
  const resolvedProject: Project | null =
    project ??
    (apiProject
      ? {
          id: apiProject.id,
          userId: apiProject.userId,
          name: apiProject.name,
          description: apiProject.description ?? "",
          category: apiProject.category ?? "Other",
          pricingModel: "subscription",
          price: 0,
          publicMetrics: {
            mrr: 0,
            activeSubscribers: 0,
          },
          revSharePercent:
            typeof apiProject.marketerCommissionPercent === "string" ||
            typeof apiProject.marketerCommissionPercent === "number"
              ? Number(apiProject.marketerCommissionPercent) > 1
                ? Math.round(Number(apiProject.marketerCommissionPercent))
                : Math.round(Number(apiProject.marketerCommissionPercent) * 100)
              : 0,
          cookieWindowDays:
            typeof apiProject.refundWindowDays === "number"
              ? apiProject.refundWindowDays
              : 0,
          createdAt: apiProject.createdAt
            ? new Date(apiProject.createdAt)
            : new Date(),
        }
      : null);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!resolvedProject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" asChild>
          <Link href="/founder/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const metrics = projectMetrics?.summary ?? {
    totalRevenue: 0,
    affiliateRevenue: 0,
    mrr: 0,
    activeSubscribers: 0,
    affiliateMrr: 0,
    affiliateSubscribers: 0,
    customers: 0,
    affiliateCustomers: 0,
    clicks: 0,
    clicks30d: 0,
    installs: 0,
    installs30d: 0,
  };
  const revenueData =
    projectMetrics?.timeline?.map((entry) => ({
      date: entry.date,
      revenue: entry.totalRevenue / 100,
      affiliateRevenue: entry.affiliateRevenue / 100,
    })) ?? getRevenueTimeline(events, resolvedProject.id, undefined, 30);

  const clickMap = new Map<string, number>(
    (attributionClicks?.marketers ?? []).map((row) => [
      row.marketerId,
      row.clicks,
    ]),
  );
  const installMap = new Map<string, number>(
    (attributionClicks?.marketers ?? []).map((row) => [
      row.marketerId,
      row.installs ?? 0,
    ]),
  );
  const affiliateRows = buildAffiliateRows(
    projectCoupons,
    projectPurchases,
    projectMarketers,
    clickMap,
    installMap,
  );

  // Calculate commission owed per marketer
  const getCommissionOwed = (earnings: number) => {
    return earnings; // Already calculated with rev share
  };

  const handleConnectStripe = async () => {
    setConnectError("");
    try {
      const response = await fetch(
        `/api/connect/oauth/authorize?projectId=${projectId}`
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to start Stripe connect.");
      }
      const payload = await response.json();
      const url = payload?.data?.url;
      if (!url) {
        throw new Error("Stripe redirect URL missing.");
      }
      window.location.href = url;
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Unable to start Stripe connect."
      );
    }
  };

  const handleConnectRevenueCat = async () => {
    if (!projectId) return;
    setRevenueCatError(null);
    if (!revenueCatProjectId.trim() || !revenueCatApiKey.trim()) {
      setRevenueCatError("RevenueCat project ID and API key are required.");
      return;
    }
    setIsSavingRevenueCat(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/revenuecat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revenueCatProjectId: revenueCatProjectId.trim(),
            apiKey: revenueCatApiKey.trim(),
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to connect RevenueCat.");
      }
      setRevenueCatApiKey("");
      setRevenueCatWebhookSecret(payload?.data?.webhookSecret ?? "");
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    } catch (error) {
      setRevenueCatError(
        error instanceof Error ? error.message : "Unable to connect RevenueCat.",
      );
    } finally {
      setIsSavingRevenueCat(false);
    }
  };

  const handleDisconnectRevenueCat = async () => {
    if (!projectId) return;
    setRevenueCatError(null);
    setIsDisconnectingRevenueCat(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/revenuecat`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to disconnect RevenueCat.");
      }
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    } catch (error) {
      setRevenueCatError(
        error instanceof Error ? error.message : "Unable to disconnect RevenueCat.",
      );
    } finally {
      setIsDisconnectingRevenueCat(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!projectId) return;
    setConnectError("");
    setIsDisconnectingStripe(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stripe`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to disconnect Stripe.");
      }
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Unable to disconnect Stripe.",
      );
    } finally {
      setIsDisconnectingStripe(false);
    }
  };

  const formatDateInput = (value: string | Date | null | undefined) => {
    if (!value) return "";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openCreateTemplate = () => {
    setEditingTemplateId(null);
    setTemplateError(null);
    setTemplateForm({
      name: "",
      description: "",
      percentOff: "10",
      durationType: "ONCE",
      durationInMonths: "",
      startAt: "",
      endAt: "",
      maxRedemptions: "",
      productIds: [],
      allowedMarketerIds: [],
    });
    setIsTemplateOpen(true);
  };

  const openEditTemplate = (template: (typeof couponTemplates)[number]) => {
    setEditingTemplateId(template.id);
    setTemplateError(null);
    setTemplateForm({
      name: template.name,
      description: template.description ?? "",
      percentOff: String(template.percentOff),
      durationType: template.durationType ?? "ONCE",
      durationInMonths: template.durationInMonths
        ? String(template.durationInMonths)
        : "",
      startAt: formatDateInput(template.startAt),
      endAt: formatDateInput(template.endAt),
      maxRedemptions: template.maxRedemptions
        ? String(template.maxRedemptions)
        : "",
      productIds: template.productIds ?? [],
      allowedMarketerIds: (template.allowedMarketerIds as string[]) ?? [],
    });
    setIsTemplateOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!projectId) return;
    setTemplateError(null);
    setIsDeletingTemplateId(templateId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/coupon-templates`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to delete template.");
      }
      await queryClient.invalidateQueries({
        queryKey: ["coupon-templates", projectId, true],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete template.";
      setTemplateError(message);
    } finally {
      setIsDeletingTemplateId(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentUser) return;
    setTemplateError(null);
    setIsCreatingTemplate(true);
    try {
      const now = new Date();
      const startAt = templateForm.startAt
        ? new Date(templateForm.startAt)
        : null;
      const endAt = templateForm.endAt ? new Date(templateForm.endAt) : null;
      const durationType =
        templateForm.durationType === "REPEATING" ? "REPEATING" : "ONCE";
      const durationInMonths = templateForm.durationInMonths
        ? Number(templateForm.durationInMonths)
        : undefined;
      if (startAt && Number.isNaN(startAt.getTime())) {
        setTemplateError("Start date is invalid.");
        return;
      }
      if (endAt && Number.isNaN(endAt.getTime())) {
        setTemplateError("End date is invalid.");
        return;
      }
      if (startAt && endAt && startAt > endAt) {
        setTemplateError("Start date must be before end date.");
        return;
      }
      if (endAt && endAt <= now) {
        setTemplateError("End date must be in the future.");
        return;
      }
      if (
        durationType === "REPEATING" &&
        (!durationInMonths || Number.isNaN(durationInMonths) || durationInMonths < 1)
      ) {
        setTemplateError("Enter how many billing cycles the coupon should repeat.");
        return;
      }
      const isEditing = Boolean(editingTemplateId);
      const response = await fetch(
        `/api/projects/${projectId}/coupon-templates`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId: currentUser.id,
            templateId: editingTemplateId ?? undefined,
            name: templateForm.name,
            description: templateForm.description || undefined,
            percentOff: Number(templateForm.percentOff),
            durationType,
            durationInMonths:
              durationType === "REPEATING" ? durationInMonths : undefined,
            startAt: templateForm.startAt || undefined,
            endAt: templateForm.endAt || undefined,
            maxRedemptions: templateForm.maxRedemptions
              ? Number(templateForm.maxRedemptions)
            : undefined,
            productIds:
              templateForm.productIds.length > 0
                ? templateForm.productIds
                : undefined,
            allowedMarketerIds:
              templateForm.allowedMarketerIds.length > 0
                ? templateForm.allowedMarketerIds
                : undefined,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save template.");
      }
      setEditingTemplateId(null);
      setIsTemplateOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["coupon-templates", projectId, true],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save template.";
      setTemplateError(message);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-7">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/founder/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/founder/projects/${projectId}`}
                  onClick={() => setActiveTab("overview")}
                >
                  {resolvedProject.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeTabLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/founder/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{resolvedProject.name}</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 self-end">
          {isStripeConnected ? (
            <div className="inline-flex items-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-r-none border-r-0 text-xs font-medium"
              >
                Stripe connected
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-l-none"
                    aria-label="Stripe actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsStripeDisconnectDialogOpen(true)}
                    disabled={isDisconnectingStripe}
                  >
                    {isDisconnectingStripe ? "Disconnecting..." : "Disconnect Stripe"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}

          {isRevenueCatConnected ? (
            <div className="inline-flex items-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-r-none border-r-0 text-xs font-medium"
                onClick={() => setIsRevenueCatDialogOpen(true)}
              >
                RevenueCat connected
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-l-none"
                    aria-label="RevenueCat actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsRevenueCatDialogOpen(true)}
                  >
                    Webhook setup
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDisconnectDialogOpen(true)}
                    disabled={isDisconnectingRevenueCat}
                  >
                    {isDisconnectingRevenueCat
                      ? "Disconnecting..."
                      : "Disconnect RevenueCat"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}

          {shouldShowStripeConnect && !isStripeConnected && (
            <Button onClick={handleConnectStripe}>Connect Stripe</Button>
          )}

          {shouldShowRevenueCatConnect && !isRevenueCatConnected && (
            <Button
              variant="outline"
              onClick={() => setIsRevenueCatDialogOpen(true)}
            >
              Connect RevenueCat
            </Button>
          )}

          {connectError && (
            <p className="text-sm text-destructive">{connectError}</p>
          )}
          {revenueCatError && (
            <p className="text-sm text-destructive">{revenueCatError}</p>
          )}
        </div>
      </div>

      <Dialog
        open={isRevenueCatDialogOpen}
        onOpenChange={(open) => {
          setIsRevenueCatDialogOpen(open);
          if (open) {
            setRevenueCatError(null);
            setRevenueCatWebhookError(null);
            setRevenueCatWebhookStatus(null);
          }
          if (open && !isRevenueCatConnected) {
            setRevenueCatApiKey("");
            setRevenueCatWebhookSecret("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {isRevenueCatConnected ? "RevenueCat webhook" : "Connect RevenueCat"}
            </DialogTitle>
            <DialogDescription>
              {isRevenueCatConnected
                ? "Copy the webhook URL and secret into RevenueCat to start tracking purchases."
                : "Add your RevenueCat project ID and API key to start tracking purchases."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenuecat-project-id">RevenueCat project ID</Label>
              <Input
                id="revenuecat-project-id"
                value={revenueCatProjectId}
                onChange={(event) => setRevenueCatProjectId(event.target.value)}
                placeholder="proj_123..."
                disabled={isRevenueCatConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenuecat-api-key">RevenueCat API key</Label>
              <Input
                id="revenuecat-api-key"
                type="password"
                value={revenueCatApiKey}
                onChange={(event) => setRevenueCatApiKey(event.target.value)}
                placeholder="rcat_live_..."
                disabled={isRevenueCatConnected}
              />
            </div>
            {isRevenueCatConnected ? (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">
                    Webhook URL
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => {
                      if (webhookUrl) {
                        navigator.clipboard.writeText(webhookUrl);
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="break-all">{webhookUrl}</p>
                {revenueCatWebhookSecret ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">
                        Webhook secret
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(revenueCatWebhookSecret);
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="break-all text-foreground">
                      {revenueCatWebhookSecret}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Set the webhook header to `Authorization: Bearer {revenueCatWebhookSecret}`.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Save this secret now. It won&apos;t be shown again.
                    </p>
                    <a
                      href={`https://app.revenuecat.com/projects/${apiProject?.revenueCatProjectId}/integrations/webhooks/add`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open RevenueCat webhooks
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="text-[11px]">
                      Include `marketer_id` in subscriber attributes to attribute sales.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={async () => {
                        setRevenueCatWebhookError(null);
                        setRevenueCatWebhookStatus(null);
                        setIsCreatingRevenueCatWebhook(true);
                        try {
                          const response = await fetch(
                            `/api/projects/${projectId}/revenuecat/webhooks`,
                            { method: "POST" },
                          );
                          const payload = await response.json().catch(() => null);
                          if (!response.ok) {
                            throw new Error(
                              payload?.error ?? "Failed to create webhook.",
                            );
                          }
                          setRevenueCatWebhookStatus("Webhook created in RevenueCat.");
                        } catch (error) {
                          setRevenueCatWebhookError(
                            error instanceof Error
                              ? error.message
                              : "Failed to create webhook.",
                          );
                        } finally {
                          setIsCreatingRevenueCatWebhook(false);
                        }
                      }}
                      disabled={isCreatingRevenueCatWebhook}
                    >
                      {isCreatingRevenueCatWebhook ? "Creating..." : "Create webhook automatically"}
                    </Button>
                    {revenueCatWebhookStatus && (
                      <p className="text-[11px] text-emerald-500">
                        {revenueCatWebhookStatus}
                      </p>
                    )}
                    {revenueCatWebhookError && (
                      <p className="text-[11px] text-destructive">
                        {revenueCatWebhookError}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <a
                      href={`https://app.revenuecat.com/projects/${apiProject?.revenueCatProjectId}/integrations/webhooks/add`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open RevenueCat webhooks
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="text-[11px]">
                      Include `marketer_id` in subscriber attributes to attribute sales.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={async () => {
                        setRevenueCatWebhookError(null);
                        setRevenueCatWebhookStatus(null);
                        setIsCreatingRevenueCatWebhook(true);
                        try {
                          const response = await fetch(
                            `/api/projects/${projectId}/revenuecat/webhooks`,
                            { method: "POST" },
                          );
                          const payload = await response.json().catch(() => null);
                          if (!response.ok) {
                            throw new Error(
                              payload?.error ?? "Failed to create webhook.",
                            );
                          }
                          setRevenueCatWebhookStatus("Webhook created in RevenueCat.");
                        } catch (error) {
                          setRevenueCatWebhookError(
                            error instanceof Error
                              ? error.message
                              : "Failed to create webhook.",
                          );
                        } finally {
                          setIsCreatingRevenueCatWebhook(false);
                        }
                      }}
                      disabled={isCreatingRevenueCatWebhook}
                    >
                      {isCreatingRevenueCatWebhook ? "Creating..." : "Create webhook automatically"}
                    </Button>
                    {revenueCatWebhookStatus && (
                      <p className="text-[11px] text-emerald-500">
                        {revenueCatWebhookStatus}
                      </p>
                    )}
                    {revenueCatWebhookError && (
                      <p className="text-[11px] text-destructive">
                        {revenueCatWebhookError}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : null}
            {revenueCatError && (
              <p className="text-sm text-destructive">{revenueCatError}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            {isRevenueCatConnected ? (
              <Button
                type="button"
                onClick={() => setIsRevenueCatDialogOpen(false)}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRevenueCatDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConnectRevenueCat}
                  disabled={isSavingRevenueCat}
                >
                  {isSavingRevenueCat ? "Connecting..." : "Connect RevenueCat"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isStripeDisconnectDialogOpen}
        onOpenChange={setIsStripeDisconnectDialogOpen}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Disconnect Stripe?</DialogTitle>
            <DialogDescription>
              Stripe payments will stop syncing and your project will no longer
              accept Stripe-based purchases.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStripeDisconnectDialogOpen(false)}
              disabled={isDisconnectingStripe}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                void handleDisconnectStripe();
                setIsStripeDisconnectDialogOpen(false);
              }}
              disabled={isDisconnectingStripe}
            >
              {isDisconnectingStripe ? "Disconnecting..." : "Disconnect Stripe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDisconnectDialogOpen}
        onOpenChange={setIsDisconnectDialogOpen}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Disconnect RevenueCat?</DialogTitle>
            <DialogDescription>
              RevenueCat events will stop syncing and purchases will no longer
              be attributed automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisconnectDialogOpen(false)}
              disabled={isDisconnectingRevenueCat}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                void handleDisconnectRevenueCat();
                setIsDisconnectDialogOpen(false);
              }}
              disabled={isDisconnectingRevenueCat}
            >
              {isDisconnectingRevenueCat ? "Disconnecting..." : "Disconnect RevenueCat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Info Card */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="border-b">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger className="px-3 py-2 text-sm" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="metrics">
              Metrics
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="coupons">
              Coupons
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="marketers">
              Marketers
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="rewards">
              Rewards
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="activity">
              Activity
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="attribution">
              Attribution
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="settings">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <ProjectOverviewTab
            project={{
              pricingModel: resolvedProject.pricingModel,
              price: resolvedProject.price,
              revSharePercent: resolvedProject.revSharePercent,
              cookieWindowDays: resolvedProject.cookieWindowDays,
              autoApproveApplications: apiProject?.autoApproveApplications ?? false,
              autoApproveMatchTerms: apiProject?.autoApproveMatchTerms ?? true,
              autoApproveVerifiedOnly: apiProject?.autoApproveVerifiedOnly ?? true,
            }}
            metrics={metrics}
            currency={projectCurrency}
            revenueData={revenueData}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <ProjectMetricsTab
            metrics={metrics}
            timeline={projectMetrics?.timeline ?? []}
            currency={projectCurrency}
            affiliateRows={affiliateRows}
          />
        </TabsContent>

        <TabsContent value="coupons">
          <ProjectCouponsTab
            couponTemplates={couponTemplates}
            isTemplatesLoading={isTemplatesLoading}
            templatesError={templatesError as Error | null}
            canEdit={currentUser?.role === "founder"}
            onCreateTemplate={openCreateTemplate}
            onEditTemplate={openEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            deletingTemplateId={isDeletingTemplateId}
          />
        </TabsContent>

        <TabsContent value="marketers">
          <ProjectMarketersTab
            affiliateRows={affiliateRows}
            isLoading={isPurchasesLoading || isCouponsLoading || isMarketersLoading}
            error={(purchasesError as Error | null) ?? (couponsError as Error | null)}
          />
        </TabsContent>

        <TabsContent value="rewards">
          <ProjectRewardsTab
            projectId={projectId}
            creatorId={currentUser?.id}
            projectCurrency={projectCurrency}
            autoOpenCreate={shouldOpenReward}
            onAutoOpenHandled={() => setShouldOpenReward(false)}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ProjectActivityTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="attribution">
          <AttributionKeysSetup
            projectId={projectId}
            title="Attribution keys"
            description="Generate app keys to connect your product and track deep-link clicks."
          />
        </TabsContent>

        <TabsContent value="settings">
          {currentUser ? (
            <ProjectSettingsTab
              projectId={projectId}
              creatorId={currentUser.id}
              name={resolvedProject.name}
              description={resolvedProject.description}
              category={apiProject?.category ?? resolvedProject.category}
              currency={projectCurrency}
              marketerCommissionPercent={
                typeof apiProject?.marketerCommissionPercent === "number" ||
                typeof apiProject?.marketerCommissionPercent === "string"
                  ? Number(apiProject.marketerCommissionPercent)
                  : null
              }
              country={apiProject?.country}
              website={apiProject?.website}
              appStoreUrl={apiProject?.appStoreUrl}
              playStoreUrl={apiProject?.playStoreUrl}
              foundationDate={apiProject?.foundationDate}
              about={apiProject?.about}
              features={apiProject?.features}
              logoUrl={apiProject?.logoUrl}
              imageUrls={apiProject?.imageUrls}
              refundWindowDays={
                typeof apiProject?.refundWindowDays === "number"
                  ? apiProject.refundWindowDays
                  : null
              }
              visibility={apiProject?.visibility as VisibilityMode}
              showMrr={apiProject?.showMrr}
              showRevenue={apiProject?.showRevenue}
              showStats={apiProject?.showStats}
              showAvgCommission={apiProject?.showAvgCommission}
              autoApproveApplications={apiProject?.autoApproveApplications}
              autoApproveMatchTerms={apiProject?.autoApproveMatchTerms}
              autoApproveVerifiedOnly={apiProject?.autoApproveVerifiedOnly}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog
        open={isTemplateOpen}
        onOpenChange={(open) => {
          setIsTemplateOpen(open);
          if (!open) {
            setEditingTemplateId(null);
            setTemplateError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? "Edit coupon template" : "Create coupon template"}
            </DialogTitle>
            <DialogDescription>
              Define discount settings for marketer promo codes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="templateName">Name</Label>
              <Input
                id="templateName"
                value={templateForm.name}
                onChange={(event) =>
                  setTemplateForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Black Friday"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Input
                id="templateDescription"
                value={templateForm.description}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Seasonal discount campaign"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="templatePercentOff">Discount (%)</Label>
                <Input
                  id="templatePercentOff"
                  type="number"
                  min={1}
                  max={100}
                  value={templateForm.percentOff}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      percentOff: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateMaxRedemptions">Max redemptions</Label>
                <Input
                  id="templateMaxRedemptions"
                  type="number"
                  min={1}
                  value={templateForm.maxRedemptions}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      maxRedemptions: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Coupon duration</Label>
                <Select
                  value={templateForm.durationType}
                  onValueChange={(value) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      durationType: value,
                      durationInMonths: value === "REPEATING" ? prev.durationInMonths : "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONCE">First payment only</SelectItem>
                    <SelectItem value="REPEATING">Repeat for multiple cycles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateDurationMonths">Billing cycles</Label>
                <Input
                  id="templateDurationMonths"
                  type="number"
                  min={1}
                  max={12}
                  value={templateForm.durationInMonths}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      durationInMonths: event.target.value,
                    }))
                  }
                  placeholder="e.g. 3"
                  disabled={templateForm.durationType !== "REPEATING"}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="templateStart">Start date</Label>
                <Input
                  id="templateStart"
                  type="date"
                  value={templateForm.startAt}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      startAt: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateEnd">End date</Label>
                <Input
                  id="templateEnd"
                  type="date"
                  value={templateForm.endAt}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      endAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Products</Label>
              <Popover open={productsOpen} onOpenChange={setProductsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productsOpen}
                    className="w-full justify-between"
                    disabled={isLoadingProducts}
                  >
                    {templateForm.productIds.length === 0
                      ? "All products"
                      : templateForm.productIds.length === 1
                        ? productOptions.find(
                            (item) => item.id === templateForm.productIds[0],
                          )?.name ?? "1 product selected"
                        : `${templateForm.productIds.length} products selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        {productOptions.map((product) => {
                          const isSelected = templateForm.productIds.includes(
                            product.id,
                          );
                          return (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                setTemplateForm((prev) => {
                                  const alreadySelected = prev.productIds.includes(
                                    product.id,
                                  );
                                  return {
                                    ...prev,
                                    productIds: alreadySelected
                                      ? prev.productIds.filter(
                                          (id) => id !== product.id,
                                        )
                                      : [...prev.productIds, product.id],
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
                              {product.name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Leave empty to apply to all products.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Marketers</Label>
              <Popover open={marketersOpen} onOpenChange={setMarketersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={marketersOpen}
                    className="w-full justify-between"
                    disabled={isLoadingMarketers}
                  >
                    {templateForm.allowedMarketerIds.length === 0
                      ? "All marketers"
                      : templateForm.allowedMarketerIds.length === 1
                        ? marketerOptions.find(
                            (item) =>
                              item.id === templateForm.allowedMarketerIds[0],
                          )?.label ?? "1 marketer selected"
                        : `${templateForm.allowedMarketerIds.length} marketers selected`}
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
                            templateForm.allowedMarketerIds.includes(
                              marketer.id,
                            );
                          return (
                            <CommandItem
                              key={marketer.id}
                              value={marketer.label}
                              onSelect={() => {
                                setTemplateForm((prev) => {
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
                                      : [...prev.allowedMarketerIds, marketer.id],
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
            {templateError ? (
              <p className="text-sm text-destructive">{templateError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsTemplateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={isCreatingTemplate || !templateForm.name.trim()}
            >
              {isCreatingTemplate
                ? editingTemplateId
                  ? "Saving..."
                  : "Creating..."
                : editingTemplateId
                  ? "Save changes"
                  : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
