"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [keys, setKeys] = useState<AttributionKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [keyLabel, setKeyLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingKeyId, setRevealingKeyId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadKeys = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/projects/${projectId}/attribution-keys`,
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load app keys.");
        }
        if (isActive) {
          setKeys(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error ? err.message : "Failed to load app keys.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    void loadKeys();
    return () => {
      isActive = false;
    };
  }, [projectId]);

  const handleCreateKey = async () => {
    setError(null);
    setCreatedKey(null);
    setIsCreating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/attribution-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyLabel.trim() || undefined }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to create app key.");
      }
      const record = payload?.data;
      if (record) {
        setKeys((prev) => [record, ...prev]);
      }
      setCreatedKey(record?.key ?? null);
      if (record?.id && record?.key) {
        setRevealedKeys((prev) => ({ ...prev, [record.id]: record.key }));
      }
      setKeyLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create app key.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevealKey = async (keyId: string) => {
    setError(null);
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
      setError(err instanceof Error ? err.message : "Failed to reveal key.");
    } finally {
      setRevealingKeyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="attribution-key-label">App key label</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="attribution-key-label"
              value={keyLabel}
              onChange={(event) => setKeyLabel(event.target.value)}
              placeholder="e.g. iOS app"
            />
            <Button type="button" onClick={handleCreateKey} disabled={isCreating}>
              {isCreating ? "Generating..." : "Generate key"}
            </Button>
          </div>
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

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys created yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {key.name || "Untitled key"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {key.revokedAt ? "Revoked" : "Active"}
                    </span>
                  </div>
                  {revealedKeys[key.id] ? (
                    <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          App key
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(revealedKeys[key.id]);
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="break-all text-foreground">
                        {revealedKeys[key.id]}
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevealKey(key.id)}
                      disabled={Boolean(revealingKeyId)}
                    >
                      {revealingKeyId === key.id ? "Revealing..." : "Show key"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
