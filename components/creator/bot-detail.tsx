"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotActivity } from "@/components/creator/bot-activity";
import { BotPlans } from "@/components/creator/bot-plans";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";

export type InstallationDetail = {
  id: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  grantedScopes: string[];
  requireApprovalForPublish: boolean;
  requireApprovalForApply: boolean;
  dailyApplyLimit: number | null;
  allowedCategories: string[];
  createdAt: string;
  lastTokenIssuedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  agent: {
    id: string;
    name: string;
    manifestUrl: string | null;
    manifestSnapshotHash: string;
    createdAt: string;
  };
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().replace(".000Z", "Z");
}

function statusVariant(
  status: InstallationDetail["status"],
): "success" | "warning" | "destructive" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  return "destructive";
}

export function BotDetail({ installationId }: { installationId: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "plans">(
    "overview",
  );

  const { data, isLoading, error } = useQuery<{ data: InstallationDetail }>({
    queryKey: ["revclaw-installation", installationId],
    queryFn: async () => {
      const res = await fetch(`/api/revclaw/installations/${installationId}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load bot");
      return json;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-muted-foreground">Unable to load bot.</div>
        <div className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : null}
        </div>
        <Button asChild variant="outline">
          <Link href="/founder/bots">Back</Link>
        </Button>
      </div>
    );
  }

  const bot = data?.data;

  if (!bot) {
    return (
      <div className="space-y-3">
        <div className="text-muted-foreground">Bot not found.</div>
        <Button asChild variant="outline">
          <Link href="/founder/bots">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header (match project detail header style) */}
      <div className="flex items-start justify-between">
        <div className="space-y-7">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/founder/bots">Bots</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{bot.agent.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/founder/bots">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{bot.agent.name}</h1>
          </div>
        </div>
        <div className="self-end">
          <Badge
            variant={statusVariant(bot.status)}
            className="uppercase tracking-wide"
          >
            {bot.status}
          </Badge>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "overview" | "activity" | "plans")
        }
        className="space-y-6"
      >
        <div className="border-b">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger className="px-3 py-2 text-sm" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="activity">
              Activity
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="plans">
              Plans
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access</CardTitle>
              <CardDescription>
                Installation id: <span className="font-mono">{bot?.id}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Granted scopes:</span>
            {bot.grantedScopes.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {bot.grantedScopes.map((scope) => (
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
              <div className="mt-1 text-muted-foreground">-</div>
            )}
          </div>
          <div>
            <span className="font-semibold">Created:</span>{" "}
            <span className="text-muted-foreground">
              {formatDate(bot.createdAt)}
            </span>
          </div>
          <div>
            <span className="font-semibold">Last token issued:</span>{" "}
            <span className="text-muted-foreground">
              {formatDate(bot.lastTokenIssuedAt)}
            </span>
          </div>
          <div>
            <span className="font-semibold">Approval required:</span>
            <div className="mt-1">
              {[
                bot.requireApprovalForPublish ? "Publish" : null,
                bot.requireApprovalForApply ? "Apply" : null,
              ].filter(Boolean).length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {[bot.requireApprovalForPublish ? "Publish" : null, bot.requireApprovalForApply ? "Apply" : null]
                    .filter(Boolean)
                    .map((label) => (
                      <Badge
                        key={label as string}
                        variant="outline"
                        className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {label as string}
                      </Badge>
                    ))}
                </div>
              ) : (
                <div className="text-muted-foreground">-</div>
              )}
            </div>
          </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent</CardTitle>
              <CardDescription>Agent id: {bot.agent.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Manifest URL:</span>{" "}
            <span className="text-muted-foreground">
              {bot.agent.manifestUrl ?? "-"}
            </span>
          </div>
          <div>
            <span className="font-semibold">Manifest hash:</span>{" "}
            <span className="font-mono text-muted-foreground">
              {bot.agent.manifestSnapshotHash ?? "-"}
            </span>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <BotActivity installationId={installationId} />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <BotPlans installationId={installationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
