"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ApplyToPromoteDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string | null;
  isAlreadyPromoting?: boolean;
  commissionInput: string;
  onCommissionChange: (value: string) => void;
  refundWindowInput: string;
  onRefundWindowChange: (value: string) => void;
  applicationMessage: string;
  onApplicationMessageChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitDisabled?: boolean;
  formError?: string | null;
  autoApproveAlert?: React.ReactNode;
};

export function ApplyToPromoteDialog({
  isOpen,
  onOpenChange,
  projectName,
  isAlreadyPromoting = false,
  commissionInput,
  onCommissionChange,
  refundWindowInput,
  onRefundWindowChange,
  applicationMessage,
  onApplicationMessageChange,
  onSubmit,
  isSubmitting,
  submitDisabled = false,
  formError,
  autoApproveAlert,
}: ApplyToPromoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {isAlreadyPromoting ? (
          <>
            <DialogHeader>
              <DialogTitle>Already Promoting</DialogTitle>
              <DialogDescription>
                You are already promoting{" "}
                <span className="font-medium">
                  {projectName ?? "this project"}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Your application has been approved and you are currently
                promoting this project. You can view your performance and
                earnings in your dashboard.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply to Promote</DialogTitle>
              <DialogDescription>
                Request to promote{" "}
                <span className="font-medium">
                  {projectName ?? "this project"}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {autoApproveAlert}
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min={0}
                  step="0.5"
                  value={commissionInput}
                  onChange={(event) => onCommissionChange(event.target.value)}
                  placeholder="20"
                />
                <p className="text-xs text-muted-foreground">
                  You can negotiate a custom commission for this project.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundWindow">Refund window (days)</Label>
                <Input
                  id="refundWindow"
                  type="number"
                  min={0}
                  value={refundWindowInput}
                  onChange={(event) => onRefundWindowChange(event.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Commissions become payable after this window passes.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={applicationMessage}
                  onChange={(event) =>
                    onApplicationMessageChange(event.target.value)
                  }
                  placeholder="Introduce yourself or share why you're a great fit."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Optional message for the founder (max 2000 characters).
                </p>
              </div>
              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitDisabled || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
