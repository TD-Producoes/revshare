"use client";

import { Badge } from "@/components/ui/badge";
import { useProjectEvents } from "@/lib/hooks/events";
import { useCreatorAdjustments } from "@/lib/hooks/creator";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { ProjectTabEmptyState } from "@/components/shared/project-tab-empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/data/metrics";

const eventLabels: Record<string, string> = {
  CONTRACT_CREATED: "Contract created",
  CONTRACT_APPROVED: "Contract approved",
  CONTRACT_REJECTED: "Contract rejected",
  COUPON_CLAIMED: "Coupon claimed",
  COUPON_TEMPLATE_CREATED: "Template created",
  COUPON_TEMPLATE_UPDATED: "Template updated",
  PURCHASE_CREATED: "Purchase recorded",
  PURCHASE_REFUNDED: "Purchase refunded",
  PURCHASE_CHARGEBACK: "Chargeback opened",
  PURCHASE_CHARGEBACK_RESOLVED: "Chargeback resolved",
  CREATOR_PAYMENT_CREATED: "Payment created",
  CREATOR_PAYMENT_COMPLETED: "Payment completed",
  TRANSFER_INITIATED: "Transfer initiated",
  TRANSFER_COMPLETED: "Transfer completed",
  TRANSFER_FAILED: "Transfer failed",
};

function formatEventTitle(type: string) {
  return eventLabels[type] ?? type.replace(/_/g, " ").toLowerCase();
}

function formatEventDetails(event: {
  type: string;
  data?: Record<string, unknown> | null;
}) {
  const data = (event.data ?? {}) as Record<string, unknown>;
  if (event.type === "PURCHASE_CREATED") {
    if (typeof data.amount !== "number") {
      return null;
    }
    const amount = formatCurrency(
      data.amount,
      typeof data.currency === "string" ? data.currency : undefined,
    );
    return amount ? `Amount · ${amount}` : null;
  }
  if (event.type === "PURCHASE_REFUNDED") {
    if (typeof data.refundAmount !== "number") {
      return null;
    }
    const amount = formatCurrency(
      data.refundAmount,
      typeof data.currency === "string" ? data.currency : undefined,
    );
    return amount ? `Refund · ${amount}` : null;
  }
  if (
    event.type === "PURCHASE_CHARGEBACK" ||
    event.type === "PURCHASE_CHARGEBACK_RESOLVED"
  ) {
    if (typeof data.amount !== "number") {
      return null;
    }
    const amount = formatCurrency(
      data.amount,
      typeof data.currency === "string" ? data.currency : undefined,
    );
    return amount ? `Amount · ${amount}` : null;
  }
  if (event.type === "COUPON_CLAIMED") {
    if (typeof data.templateId === "string") {
      return `Template · ${data.templateId}`;
    }
  }
  if (event.type === "TRANSFER_COMPLETED" || event.type === "TRANSFER_FAILED") {
    if (typeof data.amount !== "number") {
      return null;
    }
    const amount = formatCurrency(
      data.amount,
      typeof data.currency === "string" ? data.currency : undefined,
    );
    return amount ? `Amount · ${amount}` : null;
  }
  if (
    event.type === "CREATOR_PAYMENT_CREATED" ||
    event.type === "CREATOR_PAYMENT_COMPLETED"
  ) {
    if (typeof data.amountTotal === "number") {
      return `Amount · ${formatCurrency(data.amountTotal, "usd")}`;
    }
  }
  return null;
}

export function ProjectActivityTab({
  projectId,
}: {
  projectId: string;
}) {
  const { data: events = [], isLoading, error } = useProjectEvents(projectId, 40);
  const { data: authUserId } = useAuthUserId();
  const { data: currentUser } = useUser(authUserId);
  const { data: adjustments = [], isLoading: isAdjustmentsLoading } =
    useCreatorAdjustments(currentUser?.id);
  const projectAdjustments = adjustments.filter(
    (adjustment) => adjustment.projectId === projectId,
  );

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Project Activity</h3>
      {isLoading ? (
        <p className="text-muted-foreground">Loading activity...</p>
      ) : events.length === 0 ? (
        <ProjectTabEmptyState
          title="No activity yet"
          description="Project events will appear here once activity starts."
        />
      ) : (
        <div className="divide-y">
          {events.map((event) => {
            const actorLabel = event.actor?.name ?? event.actor?.email ?? "System";
            return (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 px-1 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatEventTitle(event.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {actorLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.subjectType
                      ? `${event.subjectType}${event.subjectId ? ` · ${event.subjectId}` : ""}`
                      : "System"}
                  </p>
                  {formatEventDetails(event) ? (
                    <p className="text-xs text-muted-foreground">
                      {formatEventDetails(event)}
                    </p>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Commission Adjustments</p>
        </div>
        {isAdjustmentsLoading ? (
          <p className="text-muted-foreground mt-3">Loading adjustments...</p>
        ) : projectAdjustments.length === 0 ? (
          <ProjectTabEmptyState
            className="mt-3"
            title="No adjustments yet"
            description="Commission adjustments for this project will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Marketer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectAdjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(adjustment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {adjustment.marketerName}
                  </TableCell>
                  <TableCell className="capitalize">
                    {adjustment.reason.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(adjustment.amount, adjustment.currency)}
                  </TableCell>
                  <TableCell className="capitalize">
                    <Badge variant="outline">
                      {adjustment.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {error ? (
        <p className="text-sm text-destructive mt-3">
          {error instanceof Error ? error.message : "Unable to load activity."}
        </p>
      ) : null}
    </div>
  );
}
