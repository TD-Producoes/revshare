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
    if (fields.length === 0) {
      return layout === "compact" ? 54 : 62;
    }
    if (!showRewards) {
      return layout === "compact" ? 74 : 92;
    }
    return layout === "compact" ? 94 : 122;
  }, [fields.length, layout, showRewards]);
  const iframeSnippet = `<iframe src="${widgetUrl}" title="${projectName} affiliate widget" style="width:100%;max-width:480px;height:${iframeHeight}px;border:0;border-radius:12px;overflow:hidden;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affiliate Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add this link to your website CTA button.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={affiliateLink} className="font-mono text-xs" />
            <Button onClick={() => copyText(affiliateLink, "Affiliate link")}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" asChild>
              <a href={affiliateLink} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embeddable Widget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Choose what appears in the widget, then copy the iframe snippet.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="widget-revenue"
                checked={showRevenue}
                onCheckedChange={(checked) => setShowRevenue(Boolean(checked))}
              />
              <Label htmlFor="widget-revenue">Revenue</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="widget-rewards"
                checked={showRewards}
                onCheckedChange={(checked) => setShowRewards(Boolean(checked))}
              />
              <Label htmlFor="widget-rewards">Rewards</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="widget-commission"
                checked={showCommission}
                onCheckedChange={(checked) => setShowCommission(Boolean(checked))}
              />
              <Label htmlFor="widget-commission">Commission</Label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={theme}
                onValueChange={(value: WidgetTheme) => setTheme(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={layout}
                onValueChange={(value: WidgetLayout) => setLayout(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Iframe snippet</Label>
            <Textarea
              readOnly
              value={iframeSnippet}
              className="min-h-[96px] font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={() => copyText(iframeSnippet, "Embed snippet")}>
                <Copy className="mr-2 h-4 w-4" />
                Copy snippet
              </Button>
              <Button variant="outline" onClick={() => copyText(widgetUrl, "Widget URL")}>
                Copy URL
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Live preview</Label>
            <div className="overflow-hidden rounded-xl border bg-muted/20">
              <iframe
                src={widgetUrl}
                title={`${projectName} affiliate widget preview`}
                className="w-full"
                style={{ height: iframeHeight, border: 0 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
