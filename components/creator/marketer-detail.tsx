"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, PauseCircle, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MarketerOverviewTab } from "@/components/creator/marketer-tabs/overview-tab";
import { MarketerMetricsTab } from "@/components/creator/marketer-tabs/metrics-tab";
import { useCreatorMarketerMetrics } from "@/lib/hooks/creator";
import { useProject } from "@/lib/hooks/projects";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useContractsForCreator, useUpdateContractStatus } from "@/lib/hooks/contracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CreatorMarketerDetail({ marketerId }: { marketerId: string }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const { data: creatorId } = useAuthUserId();
  const { data: contracts = [] } = useContractsForCreator(creatorId);
  const updateStatus = useUpdateContractStatus();
  const queryClient = useQueryClient();
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
    clicksCount: 0,
  };
  const timeline = metrics?.timeline ?? [];
  const activeTabLabel = { overview: "Overview", metrics: "Metrics" }[
    activeTab
  ];
  const contractsToPause = useMemo(
    () =>
      contracts.filter(
        (contract) =>
          contract.userId === marketerId &&
          contract.status === "approved"
      ),
    [contracts, marketerId]
  );

  const handlePauseContracts = async () => {
    if (!creatorId || contractsToPause.length === 0) {
      setIsPauseDialogOpen(false);
      return;
    }
    setIsPausing(true);
    try {
      await Promise.all(
        contractsToPause.map((contract) =>
          updateStatus.mutateAsync({
            contractId: contract.id,
            creatorId,
            status: "paused",
          })
        )
      );
      await queryClient.invalidateQueries({
        queryKey: ["creator-marketer-metrics", marketerId ?? "none"],
      });
      setIsPauseDialogOpen(false);
    } finally {
      setIsPausing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-7">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/founder/affiliates">
                  Affiliates
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/founder/affiliates/${marketerId}`}
                  onClick={() => setActiveTab("overview")}
                >
                  {marketer?.name ?? "Affiliate"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeTabLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/founder/affiliates">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold">
                {marketer?.name ?? "Affiliate"}
              </h1>
              <Badge variant="secondary">Affiliate</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {marketer?.email ?? "No email on file"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPauseDialogOpen(true)}
          >
            <PauseCircle className="mr-2 h-4 w-4" />
            Pause Contracts
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
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
            clicksTotal={summary.clicksCount}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Pause all contracts for this marketer?</DialogTitle>
            <DialogDescription>
              Applications will be paused, and revenue generated by this marketer
              will not be associated to them while the applications are paused.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPauseDialogOpen(false)}
              disabled={isPausing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handlePauseContracts}
              disabled={isPausing || contractsToPause.length === 0}
            >
              {isPausing ? "Pausing..." : "Pause contracts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
