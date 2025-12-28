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
import { Copy, ExternalLink } from "lucide-react";
import { Offer } from "@/lib/data/types";
import { Contract } from "@/lib/hooks/contracts";
import { useClaimCoupon, useCouponsForMarketer } from "@/lib/hooks/coupons";
import { useEffect, useState } from "react";
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
  const hasContracts = contracts.length > 0;

  const displayOffers = limit ? offers.slice(0, limit) : offers;
  const displayContracts = limit ? contracts.slice(0, limit) : contracts;

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const getCreator = (creatorId: string) => {
    return users.find((u) => u.id === creatorId);
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
    return coupons.find((coupon) => coupon.projectId === projectId) ?? null;
  };

  const buildReferralLink = (projectId: string, code: string) => {
    if (typeof window === "undefined") return "-";
    return `${window.location.origin}/?projectId=${projectId}&promotionCode=${code}`;
  };

  const handleClaimCoupon = async (projectId: string) => {
    if (!userId) return;
    setCouponError(null);
    try {
      await claimCoupon.mutateAsync({ projectId, marketerId: userId });
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

  if (hasContracts) {
    if (!userId) {
      return null;
    }
    return (
      <div className="space-y-4">
        {couponError ? (
          <p className="text-sm text-destructive">{couponError}</p>
        ) : null}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Referral Link</TableHead>
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
                const isClaiming =
                  claimCoupon.isPending &&
                  claimCoupon.variables?.projectId === contract.projectId;

                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.projectName}
                    </TableCell>
                    <TableCell className="text-right">
                      {commissionPercent}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {referralLink ? (
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-[160px]">
                            {referralLink}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(referralLink)}
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
                      ) : contract.status === "approved" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClaimCoupon(contract.projectId)}
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
        </div>

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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Rev Share</TableHead>
              <TableHead>Referral Link</TableHead>
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

              const metrics = getMarketerProjectMetrics(
                events,
                project,
                userId
              );

              return (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.name}</p>
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
                        {offer.referralLink}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(offer.referralLink)}
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
      </div>

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
