"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectSettingsTab({
  projectId,
  creatorId,
  name,
  description,
  category,
  currency,
  marketerCommissionPercent,
}: {
  projectId: string;
  creatorId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  currency?: string | null;
  marketerCommissionPercent?: number | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: name ?? "",
    description: description ?? "",
    category: category ?? "",
    currency: (currency ?? "USD").toUpperCase(),
    commissionPercent:
      marketerCommissionPercent != null
        ? String(
            marketerCommissionPercent > 1
              ? Math.round(marketerCommissionPercent)
              : Math.round(marketerCommissionPercent * 100),
          )
        : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      name: name ?? "",
      description: description ?? "",
      category: category ?? "",
      currency: (currency ?? "USD").toUpperCase(),
      commissionPercent:
        marketerCommissionPercent != null
          ? String(
              marketerCommissionPercent > 1
                ? Math.round(marketerCommissionPercent)
                : Math.round(marketerCommissionPercent * 100),
            )
          : "",
    });
  }, [name, description, category, currency, marketerCommissionPercent]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: creatorId,
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim() || undefined,
          currency: form.currency,
          marketerCommissionPercent: form.commissionPercent
            ? Number(form.commissionPercent)
            : undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to update project.");
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["projects", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projects", creatorId ?? "all"],
        }),
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update project.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="projectName">Project name</Label>
          <Input
            id="projectName"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectDescription">Description</Label>
          <Textarea
            id="projectDescription"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectCategory">Category</Label>
          <Input
            id="projectCategory"
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value }))
            }
            placeholder="e.g. Productivity"
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={form.currency}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, currency: value }))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectCommission">
            Default marketer commission (%)
          </Label>
          <Input
            id="projectCommission"
            type="number"
            min={0}
            max={100}
            value={form.commissionPercent}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                commissionPercent: event.target.value,
              }))
            }
            placeholder="20"
          />
          <p className="text-xs text-muted-foreground">
            Updating this won&apos;t change existing contracts.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
