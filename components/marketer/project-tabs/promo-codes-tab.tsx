"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Coupon, CouponTemplate } from "@/lib/hooks/coupons";

type PromoCodesTabProps = {
  templates: CouponTemplate[];
  coupons: Coupon[];
  selectedTemplateId: string;
  customCode: string;
  promoError: string | null;
  onTemplateChange: (value: string) => void;
  onCustomCodeChange: (value: string) => void;
  onGenerate: () => Promise<void>;
  onCopy: (value: string) => void;
};

export function MarketerPromoCodesTab({
  templates,
  coupons,
  selectedTemplateId,
  customCode,
  promoError,
  onTemplateChange,
  onCustomCodeChange,
  onGenerate,
  onCopy,
}: PromoCodesTabProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const existingCoupon = selectedTemplateId
    ? coupons.find((coupon) => coupon.templateId === selectedTemplateId)
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Your Promo Codes</CardTitle>
          <Button size="sm" onClick={() => setIsGenerateOpen(true)}>
            Generate promo code
          </Button>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven&apos;t generated any promo codes for this project yet.
            </p>
          ) : (
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
                {coupons.map((coupon) => (
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
                          onClick={() => onCopy(coupon.code)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate promo code</DialogTitle>
            <DialogDescription>
              Select a coupon template and generate a promo code for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Coupon Template</Label>
              <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
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
                  <Badge variant="secondary">
                    {selectedTemplate.percentOff}% off
                  </Badge>
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
                    Max redemptions:{" "}
                    {selectedTemplate.maxRedemptions ?? "Unlimited"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="customCode">Custom code (optional)</Label>
              <Input
                id="customCode"
                value={customCode}
                onChange={(event) => onCustomCodeChange(event.target.value)}
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
                    onClick={() => onCopy(existingCoupon.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : null}

            {promoError ? (
              <p className="text-sm text-destructive">{promoError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsGenerateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await onGenerate();
                  setIsGenerateOpen(false);
                } catch {
                  // Keep dialog open to show error message.
                }
              }}
              disabled={!selectedTemplateId || Boolean(existingCoupon)}
            >
              Generate promo code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
