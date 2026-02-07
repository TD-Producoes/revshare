"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type DistributionTabProps = {
  projectId: string;
  projectName: string;
};

type WidgetTheme = "light" | "dark" | "auto";
type WidgetLayout = "compact" | "standard" | "minimal";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function ProjectDistributionTab({
  projectId,
  projectName,
}: DistributionTabProps) {
  const [showRevenue, setShowRevenue] = useState(true);
  const [showRewards, setShowRewards] = useState(true);
  const [showCommission, setShowCommission] = useState(true);
  const [theme, setTheme] = useState<WidgetTheme>("auto");
  const [layout, setLayout] = useState<WidgetLayout>("standard");

  const baseUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return normalizeBaseUrl(window.location.origin);
    }
    return normalizeBaseUrl(
      process.env.NEXT_PUBLIC_SITE_URL || "https://revshare.fast"
    );
  }, []);

  const fields = useMemo(() => {
    const selected: string[] = [];
    if (showRevenue) selected.push("revenue");
    if (showRewards) selected.push("rewards");
    if (showCommission) selected.push("commission");
    return selected;
  }, [showRevenue, showRewards, showCommission]);

  const affiliateLink = useMemo(
    () =>
      `${baseUrl}/projects/${encodeURIComponent(
        projectId
      )}?intent=affiliate_apply&src=founder_site`,
    [baseUrl, projectId]
  );

  const widgetUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("fields", fields.join(","));
    params.set("theme", theme);
    params.set("layout", layout);
    return `${baseUrl}/embed/projects/${encodeURIComponent(
      projectId
    )}?${params.toString()}`;
  }, [baseUrl, fields, layout, projectId, theme]);

  const iframeHeight = useMemo(() => {
    if (layout === "minimal") {
      return 60;
    }
    if (fields.length === 0) {
      return layout === "compact" ? 100 : 130;
    }
    if (!showRewards) {
      return layout === "compact" ? 125 : 180;
    }
    return layout === "compact" ? 170 : 260;
  }, [fields.length, layout, showRewards]);
  const iframeSnippet = `<iframe src="${widgetUrl}" title="${projectName} affiliate widget" style="width:100%;max-width:${layout === "minimal" ? "280px" : layout === "compact" ? "340px" : "420px"};height:${iframeHeight}px;border:0;border-radius:8px;overflow:hidden;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Affiliate Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Direct Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Share this direct link to your affiliate program signup page.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={affiliateLink} className="font-mono text-xs flex-1" />
            <div className="flex gap-2">
              <Button onClick={() => copyText(affiliateLink, "Affiliate link")} size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={affiliateLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embeddable Widget Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Embeddable Widget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Customize and embed a beautiful affiliate card on your website.
          </p>

          {/* Layout Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Layout Style</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => setLayout("standard")}
                className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                  layout === "standard" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="text-sm font-medium mb-1">Standard</div>
                <div className="text-xs text-muted-foreground">Full card with all details</div>
                {layout === "standard" && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              <button
                onClick={() => setLayout("compact")}
                className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                  layout === "compact" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="text-sm font-medium mb-1">Compact</div>
                <div className="text-xs text-muted-foreground">Smaller, condensed view</div>
                {layout === "compact" && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              <button
                onClick={() => setLayout("minimal")}
                className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                  layout === "minimal" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="text-sm font-medium mb-1">Minimal</div>
                <div className="text-xs text-muted-foreground">Button only</div>
                {layout === "minimal" && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Fields Selection - Only show if not minimal */}
          {layout !== "minimal" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Display Fields</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Checkbox
                    id="widget-revenue"
                    checked={showRevenue}
                    onCheckedChange={(checked) => setShowRevenue(Boolean(checked))}
                  />
                  <Label htmlFor="widget-revenue" className="cursor-pointer font-normal">
                    Revenue Stats
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Checkbox
                    id="widget-commission"
                    checked={showCommission}
                    onCheckedChange={(checked) => setShowCommission(Boolean(checked))}
                  />
                  <Label htmlFor="widget-commission" className="cursor-pointer font-normal">
                    Commission %
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Checkbox
                    id="widget-rewards"
                    checked={showRewards}
                    onCheckedChange={(checked) => setShowRewards(Boolean(checked))}
                  />
                  <Label htmlFor="widget-rewards" className="cursor-pointer font-normal">
                    Milestone Rewards
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Theme Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Theme</Label>
              <Select
                value={theme}
                onValueChange={(value: WidgetTheme) => setTheme(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Auto (System)
                    </div>
                  </SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Dark
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Embed Code</Label>
            <div className="relative">
              <Textarea
                readOnly
                value={iframeSnippet}
                className="min-h-[96px] font-mono text-xs pr-20 resize-none"
              />
              <Button
                size="sm"
                onClick={() => copyText(iframeSnippet, "Embed snippet")}
                className="absolute top-2 right-2"
              >
                <Copy className="mr-2 h-3 w-3" />
                Copy
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyText(widgetUrl, "Widget URL")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Copy Widget URL
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Live Preview</Label>
            <div className="rounded-xl border-2 bg-gradient-to-br from-muted/30 to-muted/10 p-6 flex items-center justify-center" style={{ minHeight: `${iframeHeight + 50}px` }}>
              <iframe
                src={widgetUrl}
                title={`${projectName} affiliate widget preview`}
                style={{
                  width: "100%",
                  maxWidth: layout === "minimal" ? "280px" : layout === "compact" ? "340px" : "420px",
                  height: `${iframeHeight}px`,
                  border: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Preview shows the widget with the exact dimensions it will have when embedded on your website.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
