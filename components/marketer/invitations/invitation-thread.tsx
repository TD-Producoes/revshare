"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openGlobalChatDrawer } from "@/lib/chat/events";
import { ArrowLeft, ExternalLink, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

type InvitationDetail = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  message: string;
  commissionPercentSnapshot: string | number;
  refundWindowDaysSnapshot: number;
  createdAt: string;
  project: { id: string; name: string };
  founder: { id: string; name: string | null; email: string | null };
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
  if (status === "PENDING") return "Review terms and respond when ready.";
  if (status === "ACCEPTED") return "You accepted this invitation.";
  if (status === "DECLINED") return "You declined this invitation.";
  return "This invitation is no longer active.";
}

export function InvitationThread({
  invitationId,
}: {
  invitationId: string;
}) {
  const queryClient = useQueryClient();
  const [isActing, setIsActing] = useState<null | "accept" | "decline">(null);

  const invitationQuery = useQuery<{ data: InvitationDetail }>({
    queryKey: ["marketer-invitation", invitationId],
    queryFn: async () => {
      const res = await fetch(`/api/marketer/invitations/${invitationId}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load invitation");
      return json;
    },
  });

  const invitation = invitationQuery.data?.data;

  const handleAction = async (action: "accept" | "decline") => {
    setIsActing(action);
    try {
      const res = await fetch(
        `/api/marketer/invitations/${invitationId}/${action}`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Failed to ${action}`);
      toast.success(
        action === "accept" ? "Invitation accepted" : "Invitation declined",
      );
      await queryClient.invalidateQueries({
        queryKey: ["marketer-invitation", invitationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["marketer-invitations"],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action}`);
    } finally {
      setIsActing(null);
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
          <Link href="/marketer/invitations">Back</Link>
        </Button>
      </div>
    );
  }

  const canAct = invitation.status === "PENDING";
  const founderName =
    invitation.founder.name ?? invitation.founder.email ?? "Founder";

  return (
    <div className="space-y-6 pb-2">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/marketer/invitations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{invitation.project.name}</h1>
          <Badge
            variant={statusVariant(invitation.status)}
            className="uppercase tracking-wide"
          >
            {invitation.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Invitation from {founderName} • Received{" "}
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
              Received
            </p>
            <p className="mt-1 text-lg font-semibold">
              {new Date(invitation.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {canAct ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => void handleAction("decline")}
            disabled={isActing !== null}
          >
            {isActing === "decline" ? "Declining..." : "Decline"}
          </Button>
          <Button
            onClick={() => void handleAction("accept")}
            disabled={isActing !== null}
          >
            {isActing === "accept" ? "Accepting..." : "Accept invitation"}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invitation message</CardTitle>
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
                Keep discussion in one place with the founder by opening the global chat drawer.
              </p>
              <Button
                className="w-full justify-start gap-2"
                onClick={() =>
                  openGlobalChatDrawer({
                    projectId: invitation.project.id,
                    counterpartyId: invitation.founder.id,
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
                  View project page
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
