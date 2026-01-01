"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Copy, ArrowLeft, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/shared/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency } from "@/lib/data/metrics";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useProject } from "@/lib/hooks/projects";
import { useContractsForMarketer } from "@/lib/hooks/contracts";
import {
  useClaimCoupon,
  useCouponsForMarketer,
  useProjectCouponTemplates,
} from "@/lib/hooks/coupons";
import { useMarketerProjectStats, useMarketerPurchases } from "@/lib/hooks/marketer";

interface MarketerProjectDetailProps {
  projectId: string;
}

export function MarketerProjectDetail({ projectId }: MarketerProjectDetailProps) {
  const params = useParams<{ projectId?: string }>();
  const resolvedProjectId =
    projectId ||
    (typeof params?.projectId === "string" ? params.projectId : null);
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: project, isLoading: isProjectLoading } =
    useProject(resolvedProjectId);
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);
  const { data: purchases = [], isLoading: isPurchasesLoading } =
    useMarketerPurchases(currentUser?.id);
  const { data: coupons = [], isLoading: isCouponsLoading } =
    useCouponsForMarketer(currentUser?.id);
  const { data: stats, isLoading: isStatsLoading, error: statsError } =
    useMarketerProjectStats(resolvedProjectId, currentUser?.id);
  const { data: templates = [], isLoading: isTemplatesLoading } =
    useProjectCouponTemplates(resolvedProjectId, false, currentUser?.id);
  const claimCoupon = useClaimCoupon();

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState("");

  const isLoading =
    isAuthLoading ||
    isUserLoading ||
    isProjectLoading ||
    isContractsLoading ||
    isPurchasesLoading ||
    isCouponsLoading ||
    isStatsLoading ||
    isTemplatesLoading;

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

  const contract = contracts.find(
    (item) => item.projectId === resolvedProjectId,
  );

  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const existingCoupon = selectedTemplateId
    ? projectCoupons.find((coupon) => coupon.templateId === selectedTemplateId)
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
    }
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
    return <div className="text-muted-foreground">Project not found.</div>;
  }

  if (!project) {
    return (
      <div className="text-muted-foreground">Project not found.</div>
    );
  }

  if (statsError) {
    return (
      <div className="text-muted-foreground">
        {statsError instanceof Error
          ? statsError.message
          : "Unable to load project stats."}
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

  const totals = stats?.totals ?? {
    purchases: 0,
    revenue: 0,
    commission: 0,
  };
  const commissionStatus = stats?.commissions ?? {
    awaitingCreator: { count: 0, amount: 0 },
    awaitingRefundWindow: { count: 0, amount: 0 },
    ready: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketer/offers" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to offers
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue Attributed"
          value={formatCurrency(totals.revenue, projectCurrency)}
          description={`${totals.purchases} purchases`}
          icon={Tag}
        />
        <StatCard
          title="Total Commission"
          value={formatCurrency(totals.commission, projectCurrency)}
          description="All time"
          icon={Tag}
        />
        <StatCard
          title="Awaiting Creator"
          value={formatCurrency(
            commissionStatus.awaitingCreator.amount,
            projectCurrency,
          )}
          description={`${commissionStatus.awaitingCreator.count} purchases`}
          icon={Tag}
        />
        <StatCard
          title="Refund Window"
          value={formatCurrency(
            commissionStatus.awaitingRefundWindow.amount,
            projectCurrency,
          )}
          description={`${commissionStatus.awaitingRefundWindow.count} purchases`}
          icon={Tag}
        />
        <StatCard
          title="Ready to Payout"
          value={formatCurrency(commissionStatus.ready.amount, projectCurrency)}
          description={`${commissionStatus.ready.count} purchases`}
          icon={Tag}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Promo Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {projectCoupons.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                You haven&apos;t generated any promo codes for this project yet.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Promo Code</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">
                          {coupon.template?.name ?? "Template"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopy(coupon.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {coupon.percentOff}%
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {coupon.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(coupon.claimedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Promo Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Coupon Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={(value) => {
                  setSelectedTemplateId(value);
                  setPromoError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a coupon template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No templates available
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} · {template.percentOff}%
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedTemplate.name}</span>
                  <Badge variant="secondary">{selectedTemplate.percentOff}% off</Badge>
                </div>
                {selectedTemplate.description ? (
                  <p className="text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                ) : null}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Window:{" "}
                    {selectedTemplate.startAt
                      ? new Date(selectedTemplate.startAt).toLocaleDateString()
                      : "Anytime"}{" "}
                    →{" "}
                    {selectedTemplate.endAt
                      ? new Date(selectedTemplate.endAt).toLocaleDateString()
                      : "No end"}
                  </p>
                  <p>
                    Max redemptions: {selectedTemplate.maxRedemptions ?? "Unlimited"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="customCode">Custom code (optional)</Label>
              <Input
                id="customCode"
                value={customCode}
                onChange={(event) => setCustomCode(event.target.value)}
                placeholder="Leave empty to auto-generate"
              />
            </div>

            {existingCoupon ? (
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">
                  You already have a promo code for this template:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {existingCoupon.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(existingCoupon.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : null}

            {promoError ? (
              <p className="text-sm text-destructive">{promoError}</p>
            ) : null}

            <Button
              className="w-full"
              onClick={handleGeneratePromo}
              disabled={!selectedTemplateId || Boolean(existingCoupon)}
            >
              Generate promo code
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchases for this Project</CardTitle>
        </CardHeader>
        <CardContent>
          {projectPurchases.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No purchases yet for this project.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Refund Ends</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        {purchase.couponCode ? (
                          <Badge variant="secondary">{purchase.couponCode}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(purchase.amount, purchase.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          purchase.commissionAmount,
                          purchase.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {purchase.refundEligibleAt
                          ? new Date(purchase.refundEligibleAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
