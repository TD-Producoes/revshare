"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreHorizontal, ShieldOff } from "lucide-react";
import { toast } from "sonner";

type InvitationRow = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  message: string;
  commissionPercentSnapshot: string | number;
  refundWindowDaysSnapshot: number;
  createdAt: string;
  marketer: { id: string; name: string | null; email: string | null; visibility: string };
};

type MarketerSearchRow = {
  id: string;
  name: string | null;
  bio?: string | null;
  specialties?: string[];
  focusArea?: string | null;
  location?: string | null;
};

function statusVariant(status: InvitationRow["status"]) {
  if (status === "PENDING") return "warning";
  if (status === "ACCEPTED") return "success";
  if (status === "DECLINED") return "secondary";
  return "destructive";
}

function percentDisplay(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "-";
  // stored as decimal (0.2) → 20
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

export function ProjectInvitationsTab({
  projectId,
  defaultCommissionPercent,
  defaultRefundWindowDays,
}: {
  projectId: string;
  defaultCommissionPercent: number;
  defaultRefundWindowDays: number;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{
    data: { invitations: InvitationRow[] };
  }>({
    queryKey: ["project-invitations", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/founder/projects/${projectId}/invitations`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load invitations");
      return json;
    },
  });

  const invitations = data?.data?.invitations ?? [];

  // Dialog state
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMarketer, setSelectedMarketer] = useState<MarketerSearchRow | null>(null);
  const [message, setMessage] = useState("");
  const [commission, setCommission] = useState(String(defaultCommissionPercent));
  const [refundWindowDays, setRefundWindowDays] = useState(String(defaultRefundWindowDays));

  useEffect(() => {
    if (!open) return;
    setCommission(String(defaultCommissionPercent));
    setRefundWindowDays(String(defaultRefundWindowDays));
  }, [open, defaultCommissionPercent, defaultRefundWindowDays]);

  const marketersQuery = useQuery<{ data: MarketerSearchRow[] }>({
    queryKey: ["marketer-search", search],
    enabled: open && search.trim().length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("search", search.trim());
      const res = await fetch(`/api/marketers/search?${params.toString()}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to search marketers");
      return json;
    },
  });

  const marketerResults = useMemo(
    () => (Array.isArray(marketersQuery.data?.data) ? marketersQuery.data!.data : []),
    [marketersQuery.data],
  );

  const handleRevoke = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/founder/invitations/${invitationId}/revoke`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to revoke invitation");
      toast.success("Invitation revoked");
      await queryClient.invalidateQueries({ queryKey: ["project-invitations", projectId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke");
    }
  };

  const handleSend = async () => {
    if (!selectedMarketer) return;

    const commissionNum = Number(commission);
    const refundNum = Number(refundWindowDays);

    try {
      const res = await fetch(`/api/founder/projects/${projectId}/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          marketerId: selectedMarketer.id,
          message,
          commissionPercent: commissionNum,
          refundWindowDays: refundNum,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to send invitation");

      toast.success("Invitation sent");
      setOpen(false);
      setSelectedMarketer(null);
      setSearch("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["project-invitations", projectId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Invitations</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          Invite marketer
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading invitations...</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load invitations"}
        </p>
      ) : invitations.length === 0 ? (
        <p className="text-muted-foreground">No invitations yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marketer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Refund window</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((inv) => (
              <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link
                    href={`/founder/invitations/${inv.id}`}
                    className="hover:underline"
                  >
                    {inv.marketer.name ?? inv.marketer.email ?? inv.marketer.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(inv.status)} className="uppercase">
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {percentDisplay(inv.commissionPercentSnapshot)}%
                </TableCell>
                <TableCell className="text-right">
                  {inv.refundWindowDaysSnapshot}d
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Invitation actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/founder/invitations/${inv.id}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          View thread
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={inv.status !== "PENDING"}
                        onClick={() => void handleRevoke(inv.id)}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Invite marketer</DialogTitle>
            <DialogDescription>
              Invite a marketer to apply to this project. You can override the
              default commission and refund window.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marketer-search">Search marketers</Label>
              <Input
                id="marketer-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedMarketer(null);
                }}
                placeholder="Type a name, bio, or specialty (min 2 chars)"
              />
              {selectedMarketer ? (
                <div className="text-sm">
                  Selected: <span className="font-semibold">{selectedMarketer.name ?? selectedMarketer.id}</span>
                </div>
              ) : null}

              {search.trim().length >= 2 ? (
                marketersQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : marketersQuery.error ? (
                  <p className="text-sm text-destructive">Failed to search marketers.</p>
                ) : marketerResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No results.</p>
                ) : (
                  <div className="max-h-56 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Focus</TableHead>
                          <TableHead>Specialties</TableHead>
                          <TableHead className="w-[88px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketerResults.slice(0, 20).map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.name ?? "(Hidden)"}</TableCell>
                            <TableCell className="text-muted-foreground">{m.focusArea ?? "-"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {(m.specialties ?? []).slice(0, 3).join(", ") || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={selectedMarketer?.id === m.id ? "secondary" : "outline"}
                                onClick={() => setSelectedMarketer(m)}
                              >
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing to search.
                </p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a short invitation message..."
              />
            </div>

            <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm">
              <div className="font-semibold">Marketer will see</div>
              <div className="mt-1 text-muted-foreground">
                Commission: <span className="font-medium text-foreground">{commission || "-"}%</span> · Refund window:{" "}
                <span className="font-medium text-foreground">{refundWindowDays || "-"} days</span>
              </div>
            </div>

            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCommission(String(defaultCommissionPercent));
                  setRefundWindowDays(String(defaultRefundWindowDays));
                }}
              >
                Reset to project defaults
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedMarketer || message.trim().length < 1}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
