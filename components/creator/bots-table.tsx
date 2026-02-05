"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExternalLink,
  MoreHorizontal,
  ShieldOff,
  Copy,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { RevclawInstallationListItem } from "@/components/creator/bots-list";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().replace(".000Z", "Z");
}

function statusVariant(
  status: RevclawInstallationListItem["status"],
): "success" | "warning" | "destructive" | "outline" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  return "destructive";
}

export function BotsTable({
  installations,
  baseHref = "/founder/bots",
}: {
  installations: RevclawInstallationListItem[];
  baseHref?: string;
}) {
  const queryClient = useQueryClient();

  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [installationToRevoke, setInstallationToRevoke] =
    useState<RevclawInstallationListItem | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const rows = useMemo(() => installations ?? [], [installations]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const openRevokeDialog = (installation: RevclawInstallationListItem) => {
    setInstallationToRevoke(installation);
    setConfirmText("");
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!installationToRevoke || confirmText !== "revoke") return;

    setIsRevoking(true);
    try {
      const res = await fetch(
        `/api/revclaw/installations/${installationToRevoke.id}/revoke`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to revoke bot");
      }

      toast.success("Bot access revoked");
      setRevokeDialogOpen(false);
      setInstallationToRevoke(null);
      await queryClient.invalidateQueries({ queryKey: ["revclaw-installations"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke bot");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scopes</TableHead>
            <TableHead>Approvals</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last token</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No bots connected yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((installation) => {
              const scopes = installation.grantedScopes ?? [];
              const approvals = [
                installation.requireApprovalForPublish ? "Publish" : null,
                installation.requireApprovalForApply ? "Apply" : null,
              ].filter(Boolean);

              return (
                <TableRow key={installation.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`${baseHref}/${installation.id}`}
                      className="hover:underline"
                    >
                      {installation.agent?.name ?? installation.agent?.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(installation.status)}>
                      {installation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {scopes.length ? (
                      <div className="flex flex-wrap gap-1">
                        {scopes.map((scope) => (
                          <Badge
                            key={scope}
                            variant="secondary"
                            className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
                          >
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {approvals.length ? (
                      <div className="flex flex-wrap gap-1">
                        {approvals.map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(installation.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(installation.lastTokenIssuedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${baseHref}/${installation.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopy(installation.id)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy installation id
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => openRevokeDialog(installation)}
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Revoke access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke bot access</DialogTitle>
            <DialogDescription>
              This will immediately revoke access for{" "}
              <span className="font-semibold">
                {installationToRevoke?.agent?.name}
              </span>
              . All tokens for this bot will be invalidated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-revoke">
              Type <span className="font-mono font-semibold">revoke</span> to
              confirm
            </Label>
            <Input
              id="confirm-revoke"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="revoke"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeConfirm}
              disabled={confirmText !== "revoke" || isRevoking}
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
