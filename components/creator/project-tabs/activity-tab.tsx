"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectEvents } from "@/lib/hooks/events";

const eventLabels: Record<string, string> = {
  CONTRACT_CREATED: "Contract created",
  CONTRACT_APPROVED: "Contract approved",
  CONTRACT_REJECTED: "Contract rejected",
  COUPON_CLAIMED: "Coupon claimed",
  COUPON_TEMPLATE_CREATED: "Template created",
  COUPON_TEMPLATE_UPDATED: "Template updated",
  PURCHASE_CREATED: "Purchase recorded",
  CREATOR_PAYMENT_CREATED: "Payment created",
  CREATOR_PAYMENT_COMPLETED: "Payment completed",
  TRANSFER_INITIATED: "Transfer initiated",
  TRANSFER_COMPLETED: "Transfer completed",
  TRANSFER_FAILED: "Transfer failed",
};

function formatEventTitle(type: string) {
  return eventLabels[type] ?? type.replace(/_/g, " ").toLowerCase();
}

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") return null;
  const normalized = (amount / 100).toFixed(2);
  return `${normalized} ${(currency ?? "usd").toUpperCase()}`;
}

function formatEventDetails(event: {
  type: string;
  data?: Record<string, unknown> | null;
}) {
  const data = (event.data ?? {}) as Record<string, unknown>;
  if (event.type === "PURCHASE_CREATED") {
    const amount = formatCurrency(
      typeof data.amount === "number" ? data.amount : undefined,
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
    const amount = formatCurrency(
      typeof data.amount === "number" ? data.amount : undefined,
      typeof data.currency === "string" ? data.currency : undefined,
    );
    if (amount) {
      return `Amount · ${amount}`;
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading activity...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground">
            No activity yet for this project.
          </p>
        ) : (
          <div className="divide-y">
            {events.map((event) => {
              const actorLabel =
                event.actor?.name ?? event.actor?.email ?? "System";
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
        {error ? (
          <p className="text-sm text-destructive mt-3">
            {error instanceof Error ? error.message : "Unable to load activity."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
