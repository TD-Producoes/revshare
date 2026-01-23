"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttributionKey = {
  id: string;
  name: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export function AttributionKeysSetup({
  projectId,
  title = "Attribution keys",
  description = "Generate a key to connect your app and start tracking deep link clicks.",
}: {
  projectId: string;
  title?: string;
  description?: string;
}) {
  const queryClient = useQueryClient();
  const [keyLabel, setKeyLabel] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingKeyId, setRevealingKeyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributionKey | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const {
    data: keys = [],
    isLoading,
    error: listError,
  } = useQuery<AttributionKey[]>({
    queryKey: ["project-attribution-keys", projectId ?? "none"],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/attribution-keys`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load app keys.");
      }
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });

  const createKey = useMutation({
    mutationFn: async (label: string) => {
      const response = await fetch(`/api/projects/${projectId}/attribution-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: label.trim() || undefined }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to create app key.");
      }
      return payload?.data as AttributionKey & { key?: string };
    },
    onSuccess: async (record) => {
      setCreatedKey(record?.key ?? null);
      if (record?.id && record?.key) {
        setRevealedKeys((prev) => ({ ...prev, [record.id]: record.key }));
      }
      setKeyLabel("");
      setIsCreateOpen(false);
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["project-attribution-keys", projectId ?? "none"],
      });
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : "Failed to create app key.",
      );
    },
  });

  const handleRevealKey = async (keyId: string) => {
    setActionError(null);
    setRevealingKeyId(keyId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/attribution-keys/${keyId}/reveal`,
        { method: "POST" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to reveal key.");
      }
      const key = payload?.data?.key;
      if (key) {
        setRevealedKeys((prev) => ({ ...prev, [keyId]: key }));
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reveal key.");
    } finally {
      setRevealingKeyId(null);
    }
  };

  const handleToggleKey = async (keyId: string) => {
    if (revealedKeys[keyId]) {
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[keyId];
        return next;
      });
      return;
    }
    await handleRevealKey(keyId);
  };

  const deleteKey = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(
        `/api/projects/${projectId}/attribution-keys/${keyId}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to delete key.");
      }
      return payload?.data as AttributionKey;
    },
    onSuccess: async (_record, keyId) => {
      setActionError(null);
      setRevealedKeys((prev) => {
        if (!prev[keyId]) return prev;
        const next = { ...prev };
        delete next[keyId];
        return next;
      });
      await queryClient.invalidateQueries({
        queryKey: ["project-attribution-keys", projectId ?? "none"],
      });
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete key.",
      );
    },
    onSettled: () => {
      setDeletingKeyId(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Create key
        </Button>
      </div>

      {createdKey ? (
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-foreground">New app key</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
              }}
            >
              Copy
            </Button>
          </div>
          <p className="break-all text-foreground">{createdKey}</p>
          <p className="text-[11px] text-muted-foreground">
            Save this key now. It won&apos;t be shown again.
          </p>
        </div>
      ) : null}

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">
          Loading keys...
        </p>
      ) : keys.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No keys created yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>App Key</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => {
              const revealedKey = revealedKeys[key.id];
              const isRevoked = Boolean(key.revokedAt);
              return (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">
                    {key.name || "Untitled key"}
                  </TableCell>
                  <TableCell>
                    {isRevoked ? "Revoked" : "Active"}
                  </TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {isRevoked ? (
                      <span className="text-xs text-muted-foreground">
                        Revoked key
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {revealedKey ? revealedKey : "••••••••••••"}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void handleToggleKey(key.id)}
                          disabled={Boolean(revealingKeyId)}
                        >
                          {revealingKeyId === key.id ? (
                            <Eye className="h-4 w-4" />
                          ) : revealedKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {revealedKey ? "Hide key" : "Show key"}
                          </span>
                        </Button>
                        {revealedKey ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(revealedKey);
                            }}
                          >
                            Copy
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Key actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isRevoked || deletingKeyId === key.id}
                          onClick={() => setDeleteTarget(key)}
                        >
                          {deletingKeyId === key.id ? "Deleting..." : "Delete"}
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

      {listError ? (
        <p className="text-sm text-destructive">
          {listError instanceof Error
            ? listError.message
            : "Failed to load app keys."}
        </p>
      ) : null}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setKeyLabel("");
            setActionError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create app key</DialogTitle>
            <DialogDescription>
              Add a label so you can identify where the key is used.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="attribution-key-label">App key label</Label>
            <Input
              id="attribution-key-label"
              value={keyLabel}
              onChange={(event) => setKeyLabel(event.target.value)}
              placeholder="e.g. iOS app"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createKey.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setActionError(null);
                setCreatedKey(null);
                void createKey.mutateAsync(keyLabel);
              }}
              disabled={createKey.isPending}
            >
              {createKey.isPending ? "Creating..." : "Create key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Delete app key?</DialogTitle>
            <DialogDescription>
              This will revoke the key immediately. Apps using it will no longer be
              able to send attribution events.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <div className="text-sm text-muted-foreground">
              {deleteTarget.name || "Untitled key"}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(
                deleteTarget?.id && deletingKeyId === deleteTarget.id,
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                setDeletingKeyId(deleteTarget.id);
                deleteKey.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
              disabled={Boolean(
                deleteTarget?.id && deletingKeyId === deleteTarget.id,
              )}
            >
              {deleteTarget?.id && deletingKeyId === deleteTarget.id
                ? "Deleting..."
                : "Delete key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
