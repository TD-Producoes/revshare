"use client";

import { useProjects, useEvents, useUsers } from "@/lib/data/store";
import {
  getMarketerProjectMetrics,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/data/metrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Copy, ExternalLink, Pause, XCircle } from "lucide-react";
import { Offer } from "@/lib/data/types";
import { Contract } from "@/lib/hooks/contracts";
import {
  useClaimCoupon,
  useCouponsForMarketer,
  useProjectCouponTemplates,
} from "@/lib/hooks/coupons";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAttributionLinks } from "@/lib/hooks/projects";

interface MyOffersTableProps {
  offers?: Offer[];
  contracts?: Contract[];
  limit?: number;
  userId?: string;
}

export function MyOffersTable({
  offers = [],
  contracts = [],
  limit,
  userId,
}: MyOffersTableProps) {
  const projects = useProjects();
  const events = useEvents();
  const users = useUsers();
  const { data: coupons = [] } = useCouponsForMarketer(userId);
  const claimCoupon = useClaimCoupon();
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutProjectId, setCheckoutProjectId] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    priceId: "",
    quantity: "1",
    customerEmail: "",
    promotionCode: "",
    allowPromotionCodes: false,
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [productPrices, setProductPrices] = useState<
    Array<{
      id: string;
      label: string;
    }>
  >([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateProjectId, setTemplateProjectId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const { data: templates = [], isLoading: isTemplatesLoading } =
    useProjectCouponTemplates(templateProjectId, false, userId);
  const hasContracts = contracts.length > 0;

  const displayOffers = useMemo(
    () => (limit ? offers.slice(0, limit) : offers),
    [offers, limit],
  );
  const displayContracts = useMemo(
    () => (limit ? contracts.slice(0, limit) : contracts),
    [contracts, limit],
  );
  const attributionProjectIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...displayContracts.map((contract) => contract.projectId),
          ...displayOffers.map((offer) => offer.projectId),
        ]),
      ).sort(),
    [displayContracts, displayOffers],
  );

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const getCreator = (creatorId: string) => {
    return users.find((u) => u.id === creatorId);
  };

  const renderContractStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="success" className="gap-1">
            <Check className="size-3 text-emerald-600" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3 text-muted-foreground" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            Rejected
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary" className="gap-1">
            <Pause className="size-3" />
            Paused
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!hasContracts && offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>You don&apos;t have any active offers yet.</p>
          <p className="text-sm mt-1">
            <Link href="/marketer/browse" className="text-primary hover:underline">
              Browse projects
            </Link>{" "}
            to find opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCouponForProject = (projectId: string) => {
    const projectCoupons = coupons.filter((coupon) => coupon.projectId === projectId);
    if (projectCoupons.length === 0) return null;
    return projectCoupons.sort((a, b) => {
      const aTime = new Date(a.claimedAt).getTime();
      const bTime = new Date(b.claimedAt).getTime();
      return bTime - aTime;
    })[0];
  };

  const buildReferralLink = (projectId: string, code: string) => {
    if (typeof window === "undefined") return "-";
    return `${window.location.origin}/?projectId=${projectId}&promotionCode=${code}`;
  };

  const handleOpenTemplateDialog = (projectId: string) => {
    setTemplateProjectId(projectId);
    setSelectedTemplateId("");
    setCouponError(null);
    setIsTemplateDialogOpen(true);
  };

  const handleClaimCoupon = async (projectId: string, templateId: string) => {
    if (!userId) return;
    setCouponError(null);
    try {
      await claimCoupon.mutateAsync({ projectId, templateId, marketerId: userId });
      setIsTemplateDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to claim coupon.";
      setCouponError(message);
    }
  };

  const handleOpenCheckout = (projectId: string, promotionCode?: string | null) => {
    setCheckoutProjectId(projectId);
    setCheckoutForm((prev) => ({
      ...prev,
      promotionCode: promotionCode ?? "",
    }));
    setCheckoutError(null);
    setCheckoutUrl("");
    setIsCheckoutOpen(true);
  };

  const handleCreateCheckout = async () => {
    if (!checkoutProjectId) return;
    setCheckoutError(null);
    setIsCreatingCheckout(true);
    try {
      const response = await fetch(
        `/api/projects/${checkoutProjectId}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: checkoutForm.priceId,
            quantity: Number(checkoutForm.quantity || "1"),
            customerEmail: checkoutForm.customerEmail || undefined,
            promotionCode: checkoutForm.promotionCode || undefined,
            allowPromotionCodes: checkoutForm.allowPromotionCodes,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to create checkout session.");
      }
      setCheckoutUrl(payload?.data?.url ?? "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create checkout session.";
      setCheckoutError(message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  useEffect(() => {
    if (!isCheckoutOpen || !checkoutProjectId) {
      return;
    }
    let isActive = true;
    const fetchPrices = async () => {
      setIsLoadingPrices(true);
      setCheckoutError(null);
      try {
        const response = await fetch(
          `/api/projects/${checkoutProjectId}/products`,
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load prices.");
        }
        const products = payload?.data?.products ?? [];
        const prices: Array<{ id: string; label: string }> = [];
        for (const product of products) {
          for (const price of product.prices ?? []) {
            const amount =
              typeof price.unitAmount === "number"
                ? (price.unitAmount / 100).toFixed(2)
                : "0.00";
            const interval = price.recurring
              ? `/${price.recurring.interval}`
              : "";
            prices.push({
              id: price.id,
              label: `${product.name} · ${amount} ${price.currency?.toUpperCase() ?? "USD"}${interval}`,
            });
          }
        }
        if (isActive) {
          setProductPrices(prices);
          if (prices.length > 0 && !checkoutForm.priceId) {
            setCheckoutForm((prev) => ({
              ...prev,
              priceId: prices[0].id,
            }));
          }
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof Error ? error.message : "Failed to load prices.";
          setCheckoutError(message);
        }
      } finally {
        if (isActive) {
          setIsLoadingPrices(false);
        }
      }
    };

    void fetchPrices();

    return () => {
      isActive = false;
    };
  }, [checkoutForm.priceId, checkoutProjectId, isCheckoutOpen]);

  useEffect(() => {
    if (!isTemplateDialogOpen || selectedTemplateId || templates.length === 0) {
      return;
    }
    setSelectedTemplateId(templates[0].id);
  }, [isTemplateDialogOpen, selectedTemplateId, templates]);

  const {
    data: shortLinks = {},
    error: shortLinkError,
  } = useAttributionLinks(attributionProjectIds, Boolean(userId));
  const shortLinkErrorMessage =
    shortLinkError instanceof Error
      ? shortLinkError.message
      : shortLinkError
        ? "Failed to load attribution links."
        : null;

  if (hasContracts) {
    if (!userId) {
      return null;
    }
    return (
      <div className="space-y-4">
        {couponError ? (
          <p className="text-sm text-destructive">{couponError}</p>
        ) : null}
        {shortLinkErrorMessage ? (
          <p className="text-sm text-destructive">{shortLinkErrorMessage}</p>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attribution Link</TableHead>
              <TableHead>Coupon</TableHead>
              <TableHead className="text-right">Test Checkout</TableHead>
              <TableHead className="text-right">Applied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayContracts.map((contract) => {
              const commissionPercent =
                contract.commissionPercent > 1
                  ? Math.round(contract.commissionPercent)
                  : Math.round(contract.commissionPercent * 100);
              const coupon = getCouponForProject(contract.projectId);
              const referralLink =
                coupon?.code
                  ? buildReferralLink(contract.projectId, coupon.code)
                  : null;
              const shortLink = shortLinks[contract.projectId] ?? null;
              const linkToShow = shortLink ?? referralLink;
              const isClaiming =
                claimCoupon.isPending &&
                claimCoupon.variables?.projectId === contract.projectId;

              // Route to offer detail page if approved, otherwise to project directory
              const projectHref =
                contract.status === "approved"
                  ? `/marketer/applications/${contract.projectId}`
                  : `/marketer/projects/${contract.projectId}`;

              return (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={projectHref}
                      className="hover:underline"
                    >
                      {contract.projectName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {commissionPercent}%
                  </TableCell>
                  <TableCell>
                    {renderContractStatusBadge(contract.status)}
                  </TableCell>
                  <TableCell>
                    {linkToShow ? (
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-[160px]">
                          {linkToShow}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(linkToShow)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon ? (
                      <div className="flex items-center gap-2">
                        <div className="space-y-1">
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {coupon.code}
                          </code>
                          {coupon.template?.name ? (
                            <p className="text-xs text-muted-foreground">
                              {coupon.template.name}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : contract.status === "approved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTemplateDialog(contract.projectId)}
                        disabled={isClaiming}
                      >
                        {isClaiming ? "Generating..." : "Generate coupon"}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleOpenCheckout(
                          contract.projectId,
                          coupon?.code ?? null,
                        )
                      }
                    >
                      Test checkout
                    </Button>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {limit && contracts.length > limit && (
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/marketer/offers">
                View All Offers ({contracts.length})
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Select coupon template</DialogTitle>
              <DialogDescription>
                Choose a founder-managed template to generate your promo code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {isTemplatesLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading templates...
                </p>
              ) : templates.length === 0 ? (
                <p className="text-muted-foreground">
                  No active templates available for this project yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} · {template.percentOff}% off
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {couponError ? (
                <p className="text-sm text-destructive">{couponError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTemplateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (templateProjectId && selectedTemplateId) {
                    handleClaimCoupon(templateProjectId, selectedTemplateId);
                  }
                }}
                disabled={
                  isTemplatesLoading ||
                  templates.length === 0 ||
                  !selectedTemplateId ||
                  claimCoupon.isPending
                }
              >
                {claimCoupon.isPending ? "Generating..." : "Generate coupon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Test Checkout</DialogTitle>
              <DialogDescription>
                Create a Stripe checkout session for this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="priceId">Price ID</Label>
              <Input
                  id="priceId"
                  value={checkoutForm.priceId}
                  onChange={(event) =>
                    setCheckoutForm((prev) => ({
                      ...prev,
                      priceId: event.target.value,
                    }))
                  }
                placeholder="price_123"
              />
            </div>
            <div className="space-y-2">
              <Label>Select price</Label>
              <Select
                value={checkoutForm.priceId}
                onValueChange={(value) =>
                  setCheckoutForm((prev) => ({ ...prev, priceId: value }))
                }
                disabled={isLoadingPrices || productPrices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingPrices ? "Loading prices..." : "Select a price"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {productPrices.map((price) => (
                    <SelectItem key={price.id} value={price.id}>
                      {price.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={checkoutForm.quantity}
                  onChange={(event) =>
                    setCheckoutForm((prev) => ({
                      ...prev,
                      quantity: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={checkoutForm.customerEmail}
                  onChange={(event) =>
                    setCheckoutForm((prev) => ({
                      ...prev,
                      customerEmail: event.target.value,
                    }))
                  }
                  placeholder="customer@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotionCode">Promotion Code</Label>
                <Input
                  id="promotionCode"
                  value={checkoutForm.promotionCode}
                  onChange={(event) =>
                    setCheckoutForm((prev) => ({
                      ...prev,
                      promotionCode: event.target.value,
                    }))
                  }
                  placeholder="PROMO123"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>Allow promotion codes</span>
                <input
                  type="checkbox"
                  checked={checkoutForm.allowPromotionCodes}
                  onChange={(event) =>
                    setCheckoutForm((prev) => ({
                      ...prev,
                      allowPromotionCodes: event.target.checked,
                    }))
                  }
                />
              </div>
              {checkoutError ? (
                <p className="text-sm text-destructive">{checkoutError}</p>
              ) : null}
              {checkoutUrl ? (
                <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Checkout URL</p>
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline break-all"
                  >
                    {checkoutUrl}
                  </a>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleCreateCheckout}
                disabled={isCreatingCheckout || !checkoutForm.priceId}
              >
                {isCreatingCheckout ? "Creating..." : "Create checkout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="space-y-4">
      {shortLinkErrorMessage ? (
        <p className="text-sm text-destructive">{shortLinkErrorMessage}</p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Founder</TableHead>
            <TableHead className="text-right">Rev Share</TableHead>
            <TableHead>Attribution Link</TableHead>
            <TableHead>Coupon</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Conversions</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayOffers.map((offer) => {
            const project = getProject(offer.projectId);
            const creator = getCreator(offer.creatorId);

            if (!project) return null;

            // Find corresponding contract for this offer
            const contract = contracts.find(
              (c) => c.projectId === offer.projectId
            );
            // Route to offer detail page if contract is approved, otherwise to project directory
            const projectHref =
              contract?.status === "approved"
                ? `/marketer/applications/${project.id}`
                : `/marketer/projects/${project.id}`;

            const metrics = getMarketerProjectMetrics(
              events,
              project,
              userId
            );

            return (
              <TableRow key={offer.id}>
                <TableCell>
                  <div>
                    <Link
                      href={projectHref}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {project.category}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {creator?.name || "Unknown"}
                </TableCell>
                <TableCell className="text-right">
                  {project.revSharePercent}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-[150px]">
                      {shortLinks[offer.projectId] ?? offer.referralLink}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        handleCopy(shortLinks[offer.projectId] ?? offer.referralLink)
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {offer.referralCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(offer.referralCode)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(metrics.clicks)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(metrics.paidCustomers)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(metrics.mrr)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(metrics.earnings)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {limit && offers.length > limit && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/marketer/offers">
              View All Offers ({offers.length})
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}

    </div>
  );
}
