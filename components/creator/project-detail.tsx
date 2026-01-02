"use client";

import { useEffect, useState } from "react";
import { useProjects, useEvents } from "@/lib/data/store";
import { getRevenueTimeline } from "@/lib/data/metrics";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Project } from "@/lib/data/types";
import {
  useProject,
  useProjectMetrics,
  useProjectPurchases,
} from "@/lib/hooks/projects";
import { useProjectCoupons, useProjectCouponTemplates } from "@/lib/hooks/coupons";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
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
import { useQueryClient } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectOverviewTab } from "@/components/creator/project-tabs/overview-tab";
import { ProjectMetricsTab } from "@/components/creator/project-tabs/metrics-tab";
import { ProjectCouponsTab } from "@/components/creator/project-tabs/coupons-tab";
import { ProjectMarketersTab } from "@/components/creator/project-tabs/marketers-tab";
import { ProjectActivityTab } from "@/components/creator/project-tabs/activity-tab";
import { ProjectSettingsTab } from "@/components/creator/project-tabs/settings-tab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectDetailProps {
  projectId: string;
}

function buildAffiliateRows(
  projectCoupons: Array<{
    code: string;
    marketer: { id: string; name: string };
  }>,
  projectPurchases: Array<{
    amount: number;
    commissionAmount: number;
    coupon: { marketer: { id: string } } | null;
  }>,
) {
  const couponMap = new Map<
    string,
    { marketerId: string; marketerName: string; codes: string[] }
  >();

  projectCoupons.forEach((coupon) => {
    const marketerId = coupon.marketer.id;
    const existing = couponMap.get(marketerId) ?? {
      marketerId,
      marketerName: coupon.marketer.name,
      codes: [],
    };
    existing.codes.push(coupon.code);
    couponMap.set(marketerId, existing);
  });

  const purchaseMap = new Map<
    string,
    { purchases: number; revenue: number; commission: number }
  >();
  projectPurchases.forEach((purchase) => {
    const marketerId = purchase.coupon?.marketer?.id;
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
    ...couponMap.keys(),
    ...purchaseMap.keys(),
  ]);

  return Array.from(marketerIds).map((marketerId) => {
    const couponInfo = couponMap.get(marketerId);
    const purchaseInfo = purchaseMap.get(marketerId);
    const codes = couponInfo?.codes ?? [];
    const codeLabel =
      codes.length > 1 ? `${codes[0]} (+${codes.length - 1})` : codes[0] ?? "-";

    return {
      marketerId,
      marketerName: couponInfo?.marketerName ?? "Unknown",
      referralCode: codeLabel,
      purchases: purchaseInfo?.purchases ?? 0,
      revenue: purchaseInfo?.revenue ?? 0,
      commission: purchaseInfo?.commission ?? 0,
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
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    percentOff: "10",
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
  const {
    data: couponTemplates = [],
    isLoading: isTemplatesLoading,
    error: templatesError,
  } = useProjectCouponTemplates(projectId, true);
  const isStripeConnected = Boolean(apiProject?.creatorStripeAccountId);
  const projectCurrency =
    typeof apiProject?.currency === "string" ? apiProject.currency : "USD";

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
          category: "Other",
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
          <Link href="/creator/projects">Back to Projects</Link>
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
  };
  const revenueData =
    projectMetrics?.timeline?.map((entry) => ({
      date: entry.date,
      revenue: entry.totalRevenue / 100,
      affiliateRevenue: entry.affiliateRevenue / 100,
    })) ?? getRevenueTimeline(events, resolvedProject.id, undefined, 30);

  const affiliateRows = buildAffiliateRows(projectCoupons, projectPurchases);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/creator/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{resolvedProject.name}</h1>
            <Badge variant="secondary">{resolvedProject.category}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 self-end">
          {isStripeConnected ? (
            <Badge className="self-end" variant="secondary">Stripe connected</Badge>
          ):(
            <Button
              onClick={handleConnectStripe}
              disabled={isStripeConnected}
            >
              Connect Stripe
            </Button>
          )}
          {connectError && (
            <p className="text-sm text-destructive">{connectError}</p>
          )}
        </div>
      </div>

      {/* Project Info Card */}
      <Tabs defaultValue="overview" className="space-y-6">
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
            <TabsTrigger className="px-3 py-2 text-sm" value="activity">
              Activity
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
            canEdit={currentUser?.role === "creator"}
            onCreateTemplate={openCreateTemplate}
            onEditTemplate={openEditTemplate}
          />
        </TabsContent>

        <TabsContent value="marketers">
          <ProjectMarketersTab
            affiliateRows={affiliateRows}
            isLoading={isPurchasesLoading || isCouponsLoading}
            error={(purchasesError as Error | null) ?? (couponsError as Error | null)}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ProjectActivityTab projectId={projectId} />
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
