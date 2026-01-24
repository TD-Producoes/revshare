"use client";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";
import type { CouponTemplate } from "@/lib/hooks/coupons";
import { useState } from "react";

type Template = CouponTemplate;

export function ProjectCouponsTab({
  couponTemplates,
  isTemplatesLoading,
  templatesError,
  canEdit,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  deletingTemplateId,
}: {
  couponTemplates: Template[];
  isTemplatesLoading: boolean;
  templatesError?: Error | null;
  canEdit: boolean;
  onCreateTemplate: () => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void | Promise<void>;
  deletingTemplateId?: string | null;
}) {
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-row items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Coupon Templates</h3>
        {canEdit ? (
          <Button size="sm" onClick={onCreateTemplate}>
            Create template
          </Button>
        ) : null}
      </div>
      {isTemplatesLoading ? (
        <p className="text-muted-foreground">Loading templates...</p>
      ) : couponTemplates.length === 0 ? (
        <p className="text-muted-foreground">
          No coupon templates yet. Create one to issue marketer promo codes.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Max Redemptions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {couponTemplates.map((template) => {
              const start = template.startAt
                ? new Date(template.startAt).toLocaleDateString()
                : "Anytime";
              const end = template.endAt
                ? new Date(template.endAt).toLocaleDateString()
                : "No end";
              const durationLabel =
                template.durationType === "REPEATING" &&
                template.durationInMonths
                  ? `Repeats for ${template.durationInMonths} months`
                  : "First payment only";
              return (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.name}
                    {template.description ? (
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {template.percentOff}%
                  </TableCell>
                  <TableCell>{durationLabel}</TableCell>
                  <TableCell>
                    {start} → {end}
                  </TableCell>
                  <TableCell className="text-right">
                    {template.maxRedemptions ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={template.status === "ACTIVE" ? "success" : "secondary"}
                      className="capitalize"
                    >
                      {template.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Template actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditTemplate(template)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={deletingTemplateId === template.id}
                            onClick={() => setDeleteTarget(template)}
                          >
                            {deletingTemplateId === template.id
                              ? "Deleting..."
                              : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {templatesError ? (
        <p className="text-sm text-destructive mt-3">
          {templatesError instanceof Error
            ? templatesError.message
            : "Unable to load templates."}
        </p>
      ) : null}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Delete coupon template?</DialogTitle>
            <DialogDescription>
              This will remove the coupon template and delete the corresponding
              coupon in Stripe.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <div className="text-sm text-muted-foreground">
              {deleteTarget.name}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(deleteTarget?.id && deletingTemplateId === deleteTarget.id)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                void onDeleteTemplate(deleteTarget.id);
                setDeleteTarget(null);
              }}
              disabled={Boolean(deleteTarget?.id && deletingTemplateId === deleteTarget.id)}
            >
              {deleteTarget?.id && deletingTemplateId === deleteTarget.id
                ? "Deleting..."
                : "Delete template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
