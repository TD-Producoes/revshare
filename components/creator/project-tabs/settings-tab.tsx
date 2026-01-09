"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { FeaturesInput } from "@/components/ui/features-input";
import { countries } from "@/lib/data/countries";
import { projectCategories } from "@/lib/data/categories";
import { VisibilitySettings } from "@/components/shared/visibility-settings";
import { VisibilityMode } from "@prisma/client";

function formatDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ProjectSettingsTab({
  projectId,
  creatorId,
  name,
  description,
  category,
  currency,
  marketerCommissionPercent,
  country,
  website,
  foundationDate,
  about,
  features,
  logoUrl,
  imageUrls,
  refundWindowDays,
  visibility,
  showMrr,
  showRevenue,
  showStats,
  showAvgCommission,
  autoApproveApplications,
  autoApproveMatchTerms,
  autoApproveVerifiedOnly,
}: {
  projectId: string;
  creatorId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  currency?: string | null;
  marketerCommissionPercent?: number | null;
  country?: string | null;
  website?: string | null;
  foundationDate?: string | Date | null;
  about?: string | null;
  features?: string[] | null;
  logoUrl?: string | null;
  imageUrls?: string[] | null;
  refundWindowDays?: number | null;
  visibility?: "PUBLIC" | "GHOST" | "PRIVATE" | null;
  showMrr?: boolean;
  showRevenue?: boolean;
  showStats?: boolean;
  showAvgCommission?: boolean;
  autoApproveApplications?: boolean;
  autoApproveMatchTerms?: boolean;
  autoApproveVerifiedOnly?: boolean;
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
              : Math.round(marketerCommissionPercent * 100)
          )
        : "",
    country: country ?? "",
    website: website ?? "",
    foundationDate: formatDateInput(foundationDate),
    about: about ?? "",
    features: features ?? [],
    logoUrl: logoUrl ?? null,
    imageUrls: imageUrls ?? [],
    refundWindowDays:
      refundWindowDays != null ? String(refundWindowDays) : "30",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(
    autoApproveApplications ?? false
  );
  const [autoApproveConditions, setAutoApproveConditions] = useState({
    requirements: autoApproveMatchTerms ?? true,
    verifiedMarketer: autoApproveVerifiedOnly ?? true,
  });

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
                : Math.round(marketerCommissionPercent * 100)
            )
          : "",
      country: country ?? "",
      website: website ?? "",
      foundationDate: formatDateInput(foundationDate),
      about: about ?? "",
      features: features ?? [],
      logoUrl: logoUrl ?? null,
      imageUrls: imageUrls ?? [],
      refundWindowDays:
        refundWindowDays != null ? String(refundWindowDays) : "30",
    });
    setAutoApproveEnabled(autoApproveApplications ?? false);
    setAutoApproveConditions({
      requirements: autoApproveMatchTerms ?? true,
      verifiedMarketer: autoApproveVerifiedOnly ?? true,
    });
  }, [
    name,
    description,
    category,
    currency,
    marketerCommissionPercent,
    country,
    website,
    foundationDate,
    about,
    features,
    logoUrl,
    imageUrls,
    refundWindowDays,
    autoApproveApplications,
    autoApproveMatchTerms,
    autoApproveVerifiedOnly,
  ]);

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
          country: form.country || undefined,
          website: form.website.trim() || null,
          foundationDate: form.foundationDate
            ? new Date(form.foundationDate).toISOString()
            : null,
          about: form.about.trim() || null,
          features: form.features,
          logoUrl: form.logoUrl,
          imageUrls: form.imageUrls,
          refundWindowDays: form.refundWindowDays
            ? Number(form.refundWindowDays)
            : undefined,
          autoApproveApplications: autoApproveEnabled,
          autoApproveMatchTerms: autoApproveConditions.requirements,
          autoApproveVerifiedOnly: autoApproveConditions.verifiedMarketer,
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

  const handleVisibilitySave = async (data: {
    visibility: "PUBLIC" | "GHOST" | "PRIVATE";
    showMrr?: boolean;
    showRevenue?: boolean;
    showStats?: boolean;
  }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: creatorId,
          ...data,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update project visibility");
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
      throw err;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

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
            <Label htmlFor="projectDescription">Short description</Label>
            <Textarea
              id="projectDescription"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectCategory">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="projectCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {projectCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={form.country}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, country: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectWebsite">Website</Label>
              <Input
                id="projectWebsite"
                type="url"
                value={form.website}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, website: event.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectFounded">Founded</Label>
              <Input
                id="projectFounded"
                type="date"
                value={form.foundationDate}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    foundationDate: event.target.value,
                  }))
                }
              />
            </div>
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
          <div className="space-y-2">
          <Label htmlFor="refundWindow">Refund window (days)</Label>
          <Input
            id="refundWindow"
            type="number"
            min={0}
            value={form.refundWindowDays}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                refundWindowDays: event.target.value,
              }))
            }
            placeholder="30"
          />
          <p className="text-xs text-muted-foreground">
            Applies to new purchases only. Existing purchases keep their original
            window.
          </p>
        </div>
        </CardContent>
      </Card>

      {/* Branding & Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding & Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project Logo</Label>
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
              userId={creatorId}
              projectId={projectId}
              type="logo"
              placeholder="Upload logo"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="projectAbout">About</Label>
            <Textarea
              id="projectAbout"
              value={form.about}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, about: event.target.value }))
              }
              rows={4}
              placeholder="Detailed description visible to potential partners..."
            />
          </div>

          <div className="space-y-2">
            <Label>Key Features</Label>
            <FeaturesInput
              value={form.features}
              onChange={(features) =>
                setForm((prev) => ({ ...prev, features }))
              }
              placeholder="Add a feature..."
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Gallery Images</Label>
            <MultiImageUpload
              value={form.imageUrls}
              onChange={(urls) =>
                setForm((prev) => ({ ...prev, imageUrls: urls }))
              }
              userId={creatorId}
              projectId={projectId}
              maxImages={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibility & Privacy Card */}
      <div className="md:col-span-2">
        <VisibilitySettings
          initialVisibility={(visibility as VisibilityMode) || "PUBLIC"}
          initialShowMrr={showMrr}
          initialShowRevenue={showRevenue}
          initialShowStats={showStats}
          initialShowAvgCommission={showAvgCommission}
          onSave={handleVisibilitySave}
          type="project"
        />
      </div>

      {/* Applications Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="autoApproveToggle">Auto-approve applications</Label>
              <p className="text-sm text-muted-foreground">
                Approve marketers automatically when they apply.
              </p>
            </div>
            <Switch
              id="autoApproveToggle"
              checked={autoApproveEnabled}
              onCheckedChange={(checked) => setAutoApproveEnabled(checked)}
            />
          </div>

          {autoApproveEnabled && (
            <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4">
              <p className="text-sm font-medium">Auto-approve if:</p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="autoApproveRequirements"
                  checked={autoApproveConditions.requirements}
                  onCheckedChange={(checked) =>
                    setAutoApproveConditions((prev) => ({
                      ...prev,
                      requirements: Boolean(checked),
                    }))
                  }
                />
                <Label
                  htmlFor="autoApproveRequirements"
                  className="text-sm font-normal leading-5"
                >
                  Application matches project requirements (commission and refund
                  window).
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="autoApproveVerified"
                  checked={autoApproveConditions.verifiedMarketer}
                  onCheckedChange={(checked) =>
                    setAutoApproveConditions((prev) => ({
                      ...prev,
                      verifiedMarketer: Boolean(checked),
                    }))
                  }
                />
                <Label
                  htmlFor="autoApproveVerified"
                  className="text-sm font-normal leading-5"
                >
                  Marketer is verified (Stripe connected).
                </Label>
              </div>
              {!autoApproveConditions.requirements &&
                !autoApproveConditions.verifiedMarketer && (
                  <p className="text-xs text-muted-foreground">
                    No conditions selected. Applications will auto-approve
                    immediately.
                  </p>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button - Full Width */}
      <div className="md:col-span-2">
        <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
