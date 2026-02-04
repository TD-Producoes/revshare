"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { ArrowLeft, ExternalLink, Pencil, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { ConversationChat } from "@/components/chat/conversation-chat";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type InvitationDetail = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  message: string;
  commissionPercentSnapshot: string | number;
  refundWindowDaysSnapshot: number;
  createdAt: string;
  project: { id: string; name: string };
  marketer: {
    id: string;
    name: string | null;
    email: string | null;
    visibility: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusVariant(status: InvitationDetail["status"]) {
  if (status === "PENDING") return "warning";
  if (status === "ACCEPTED") return "success";
  if (status === "DECLINED") return "secondary";
  return "destructive";
}

function percentDisplay(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "-";
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function FounderInvitationThread({
  invitationId,
  currentUserId,
}: {
  invitationId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [isRevoking, setIsRevoking] = useState(false);

  const [termsOpen, setTermsOpen] = useState(false);
  const [commission, setCommission] = useState("");
  const [refundWindowDays, setRefundWindowDays] = useState("");
  const [isUpdatingTerms, setIsUpdatingTerms] = useState(false);

  const invitationQuery = useQuery<{ data: InvitationDetail }>({
    queryKey: ["founder-invitation", invitationId],
    queryFn: async () => {
      const res = await fetch(`/api/founder/invitations/${invitationId}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load invitation");
      return json;
    },
  });

  const invitation = invitationQuery.data?.data;

  const startConversationQuery = useQuery<{ data: { id: string } }>({
    queryKey: ["chat-start", "invitation", invitationId],
    enabled: Boolean(invitation?.project.id) && Boolean(invitation?.marketer.id),
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: invitation!.project.id,
          counterpartyId: invitation!.marketer.id,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to start conversation");
      return json;
    },
  });

  const conversationId = startConversationQuery.data?.data?.id ?? null;

  const openEditTerms = () => {
    if (!invitation) return;
    setCommission(String(percentDisplay(invitation.commissionPercentSnapshot)));
    setRefundWindowDays(String(invitation.refundWindowDaysSnapshot));
    setTermsOpen(true);
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      const res = await fetch(
        `/api/founder/invitations/${invitationId}/revoke`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to revoke invitation");
      toast.success("Invitation revoked");
      await queryClient.invalidateQueries({
        queryKey: ["founder-invitation", invitationId],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleUpdateTerms = async () => {
    const commissionNum = Number(commission);
    const refundNum = Number(refundWindowDays);

    if (!Number.isFinite(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      toast.error("Commission must be between 0 and 100");
      return;
    }
    if (!Number.isFinite(refundNum) || refundNum < 0 || refundNum > 365) {
      toast.error("Refund window must be between 0 and 365 days");
      return;
    }

    setIsUpdatingTerms(true);
    try {
      const res = await fetch(`/api/founder/invitations/${invitationId}/update-terms`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          commissionPercent: commissionNum,
          refundWindowDays: refundNum,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to update terms");

      toast.success("Invitation terms updated");
      setTermsOpen(false);

      await queryClient.invalidateQueries({
        queryKey: ["founder-invitation", invitationId],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update terms");
    } finally {
      setIsUpdatingTerms(false);
    }
  };

  if (invitationQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (invitationQuery.error || !invitation) {
    return (
      <div className="space-y-3">
        <div className="text-muted-foreground">Unable to load invitation.</div>
        <Button asChild variant="outline">
          <Link href={`/founder/projects`}>Back to projects</Link>
        </Button>
      </div>
    );
  }

  const canEditTerms = invitation.status === "PENDING";
  const canRevoke = invitation.status === "PENDING";
  const marketerName =
    invitation.marketer.name ?? invitation.marketer.email ?? "Marketer";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/founder">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/founder/projects/${invitation.project.id}`}
                >
                  {invitation.project.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Invitation to {marketerName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/founder/projects/${invitation.project.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{marketerName}</h1>
            <Badge
              variant={statusVariant(invitation.status)}
              className="uppercase tracking-wide"
            >
              {invitation.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content: two columns on larger screens */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left: Invitation details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invitation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sent to</span>
                  <span className="font-medium">{marketerName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <Link
                    href={`/founder/projects/${invitation.project.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {invitation.project.name}
                  </Link>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="font-medium">
                    {percentDisplay(invitation.commissionPercentSnapshot)}%
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Refund window</span>
                  <span className="font-medium">
                    {invitation.refundWindowDaysSnapshot} days
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-medium">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {invitation.message && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Your message
                    </span>
                    <p className="text-sm whitespace-pre-wrap rounded-md bg-muted/30 p-3">
                      {invitation.message}
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <Link
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                href={`/projects/${invitation.project.id}`}
                target="_blank"
              >
                View public project page
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid gap-2">
            {canEditTerms && (
              <Button
                className="w-full"
                variant="outline"
                onClick={openEditTerms}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit terms
              </Button>
            )}

            {canRevoke && (
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleRevoke}
                disabled={isRevoking}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                {isRevoking ? "Revoking..." : "Revoke invitation"}
              </Button>
            )}
          </div>
        </div>

        {/* Right: Chat */}
        {conversationId ? (
          <ConversationChat
            conversationId={conversationId}
            currentUserId={currentUserId}
            counterpartyName={marketerName}
          />
        ) : (
          <div className="flex h-[500px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
            {startConversationQuery.isLoading
              ? "Starting conversation..."
              : startConversationQuery.error
                ? "Unable to start conversation."
                : "Conversation unavailable."}
          </div>
        )}
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit invitation terms</DialogTitle>
            <DialogDescription>
              Update commission and refund window for this invitation. Only pending invitations can be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input
                  id="commission"
                  inputMode="numeric"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refund">Refund window (days)</Label>
                <Input
                  id="refund"
                  inputMode="numeric"
                  value={refundWindowDays}
                  onChange={(e) => setRefundWindowDays(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <div className="font-semibold">Marketer will see</div>
              <div className="mt-1 text-muted-foreground">
                Commission: <span className="font-medium text-foreground">{commission || "-"}%</span> · Refund window:{" "}
                <span className="font-medium text-foreground">{refundWindowDays || "-"} days</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleUpdateTerms()} disabled={isUpdatingTerms}>
              {isUpdatingTerms ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
