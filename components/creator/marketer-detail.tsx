"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MessageSquare, PauseCircle, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketerOverviewTab } from "@/components/creator/marketer-tabs/overview-tab";
import { MarketerMetricsTab } from "@/components/creator/marketer-tabs/metrics-tab";
import { useCreatorMarketerMetrics } from "@/lib/hooks/creator";
import { useProject } from "@/lib/hooks/projects";

export function CreatorMarketerDetail({ marketerId }: { marketerId: string }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const { data: metrics } = useCreatorMarketerMetrics(
    marketerId,
    selectedProjectId,
    30,
  );
  const { data: selectedProject } = useProject(selectedProjectId);
  const currency =
    typeof selectedProject?.currency === "string"
      ? selectedProject.currency
      : "USD";

  const marketer = metrics?.marketer;
  const projects = metrics?.projects ?? [];
  const summary = metrics?.summary ?? {
    projectRevenue: 0,
    affiliateRevenue: 0,
    commissionOwed: 0,
    purchasesCount: 0,
    customersCount: 0,
  };
  const timeline = metrics?.timeline ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/creator/marketers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">
              {marketer?.name ?? "Marketer"}
            </h1>
            <Badge variant="secondary">Marketer</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {marketer?.email ?? "No email on file"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
          <Button variant="outline" size="sm">
            <PauseCircle className="mr-2 h-4 w-4" />
            Pause Contracts
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger className="px-3 py-2 text-sm" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="px-3 py-2 text-sm" value="metrics">
              Metrics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <MarketerOverviewTab
            summary={summary}
            currency={currency}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <MarketerMetricsTab
            timeline={timeline}
            currency={currency}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
