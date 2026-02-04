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
import { ArrowLeft, ExternalLink } from "lucide-react";
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
  founder: { id: string; name: string | null; email: string | null };
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

export function InvitationThread({
  invitationId,
  currentUserId,
}: {
  invitationId: string;
  currentUserId: string;
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

  const startConversationQuery = useQuery<{ data: { id: string } }>({
    queryKey: ["chat-start", "invitation", invitationId],
    enabled: Boolean(invitation?.project.id) && Boolean(invitation?.founder.id),
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: invitation!.project.id,
          counterpartyId: invitation!.founder.id,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to start conversation");
      return json;
    },
  });

  const conversationId = startConversationQuery.data?.data?.id ?? null;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/marketer">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/marketer/invitations">
                  Invitations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{invitation.project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
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
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{founderName}</span>
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
                  <span className="text-muted-foreground">Received</span>
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
                      Invitation message
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
                View project page
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {canAct && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => void handleAction("decline")}
                disabled={isActing !== null}
              >
                {isActing === "decline" ? "Declining..." : "Decline"}
              </Button>
              <Button
                className="flex-1"
                onClick={() => void handleAction("accept")}
                disabled={isActing !== null}
              >
                {isActing === "accept" ? "Accepting..." : "Accept"}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        {conversationId ? (
          <ConversationChat
            conversationId={conversationId}
            currentUserId={currentUserId}
            counterpartyName={founderName}
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
    </div>
  );
}
