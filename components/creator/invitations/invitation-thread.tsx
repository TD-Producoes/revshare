"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { openGlobalChatDrawer } from "@/lib/chat/events";
import {
  ArrowLeft,
  ExternalLink,
  MessageSquareText,
  Pencil,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";

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

function statusSummary(status: InvitationDetail["status"]) {
  if (status === "PENDING") return "Waiting for marketer response.";
  if (status === "ACCEPTED") return "This invitation has been accepted.";
  if (status === "DECLINED") return "This invitation was declined.";
  return "This invitation has been revoked.";
}

export function FounderInvitationThread({
  invitationId,
}: {
  invitationId: string;
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

  const openEditTerms = () => {
    if (!invitation) return;
    setCommission(String(percentDisplay(invitation.commissionPercentSnapshot)));
    setRefundWindowDays(String(invitation.refundWindowDaysSnapshot));
    setTermsOpen(true);
  };

  const handleRevoke = async () => {
    if (!invitation) return;
    const projectId = invitation.project.id;

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
      await queryClient.invalidateQueries({
        queryKey: ["project-invitations", projectId],
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
      await queryClient.invalidateQueries({
        queryKey: ["project-invitations", invitation?.project.id],
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
          <Link href="/founder/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  const canEditTerms = invitation.status === "PENDING";
  const canRevoke = invitation.status === "PENDING";
  const marketerName =
    invitation.marketer.name ?? invitation.marketer.email ?? "Marketer";

  return (
    <div className="space-y-6 pb-2">
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/founder/projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/founder/projects/${invitation.project.id}`}>
                {invitation.project.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/founder/projects/${invitation.project.id}?tab=invitations`}
              >
                invitations
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{marketerName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center gap-2">
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
        <p className="text-sm text-muted-foreground">
          Invitation for {invitation.project.name} • Sent{" "}
          {new Date(invitation.createdAt).toLocaleDateString()} •{" "}
          {statusSummary(invitation.status)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Commission
            </p>
            <p className="mt-1 text-lg font-semibold">
              {percentDisplay(invitation.commissionPercentSnapshot)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Refund window
            </p>
            <p className="mt-1 text-lg font-semibold">
              {invitation.refundWindowDaysSnapshot} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Sent
            </p>
            <p className="mt-1 text-lg font-semibold">
              {new Date(invitation.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your invitation message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {invitation.message ? (
              <p className="whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-sm leading-6">
                {invitation.message}
              </p>
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No message was included with this invitation.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Continue this conversation in the global chat drawer.
              </p>
              <Button
                className="w-full justify-start gap-2"
                onClick={() =>
                  openGlobalChatDrawer({
                    projectId: invitation.project.id,
                    counterpartyId: invitation.marketer.id,
                  })
                }
              >
                <MessageSquareText className="h-4 w-4" />
                Open chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/projects/${invitation.project.id}`} target="_blank">
                  View public project page
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEditTerms ? (
                <Button className="w-full" variant="outline" onClick={openEditTerms}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit terms
                </Button>
              ) : null}
              {canRevoke ? (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleRevoke}
                  disabled={isRevoking}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  {isRevoking ? "Revoking..." : "Revoke invitation"}
                </Button>
              ) : null}
              {!canEditTerms && !canRevoke ? (
                <p className="text-sm text-muted-foreground">
                  No actions available for this invitation status.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
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
