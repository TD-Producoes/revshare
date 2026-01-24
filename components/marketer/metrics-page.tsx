"use client";

import { useMemo, useState } from "react";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useContractsForMarketer } from "@/lib/hooks/contracts";
import { useMarketerMetrics } from "@/lib/hooks/marketer";
import { useProject } from "@/lib/hooks/projects";
import { MarketerMetricsTab } from "@/components/creator/marketer-tabs/metrics-tab";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { BadgePercent, Coins, DollarSign, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

export function MarketerMetricsPage() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const { data: metrics, isLoading: isMetricsLoading } = useMarketerMetrics(
    currentUser?.id,
    selectedProjectId,
  );
  const { data: selectedProject } = useProject(selectedProjectId);

  const projects = useMemo(
    () =>
      contracts
        .filter((contract) => contract.status === "approved")
        .map((contract) => ({
          id: contract.projectId,
          name: contract.projectName,
        })),
    [contracts],
  );

  const isLoading =
    isAuthLoading || isUserLoading || isContractsLoading || isMetricsLoading;

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "marketer") {
    return (
      <div className="text-muted-foreground">
        This section is only available to marketers.
      </div>
    );
  }

  const currency =
    typeof selectedProject?.currency === "string"
      ? selectedProject.currency
      : "USD";
  const summary = metrics?.summary ?? {
    projectRevenue: 0,
    affiliateRevenue: 0,
    commissionOwed: 0,
    purchasesCount: 0,
    customersCount: 0,
    clicksCount: 0,
    installsCount: 0,
  };
  const affiliateShare =
    summary.projectRevenue > 0
      ? Math.round((summary.affiliateRevenue / summary.projectRevenue) * 100)
      : 0;
  const selectedProjectLabel =
    projects.find((project) => project.id === selectedProjectId)?.name ??
    "All projects";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metrics</h1>
        <p className="text-muted-foreground">
          Track affiliate performance across your active projects.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between sm:w-[240px]"
              disabled={isContractsLoading}
            >
              {selectedProjectLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search projects..." />
              <CommandList>
                <CommandEmpty>No projects found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="all" onSelect={() => setSelectedProjectId(null)}>
                    <Check
                      className={cn(
                        "ml-2 mr-2 h-4 w-4",
                        selectedProjectId ? "opacity-0" : "opacity-100",
                      )}
                    />
                    All projects
                  </CommandItem>
                  {projects.map((project) => {
                    const isSelected = selectedProjectId === project.id;
                    return (
                      <CommandItem
                        key={project.id}
                        value={project.name}
                        onSelect={() => setSelectedProjectId(project.id)}
                      >
                        <Check
                          className={cn(
                            "ml-2 mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {project.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Affiliate Revenue"
          value={formatCurrency(summary.affiliateRevenue, currency)}
          description={`${affiliateShare}% of project revenue`}
          icon={DollarSign}
        />
        <StatCard
          title="Commission Owed"
          value={formatCurrency(summary.commissionOwed, currency)}
          icon={Coins}
        />
        <StatCard
          title="Project Revenue"
          value={formatCurrency(summary.projectRevenue, currency)}
          icon={BadgePercent}
        />
        <StatCard
          title="Purchases"
          value={formatNumber(summary.purchasesCount)}
          icon={ShoppingCart}
        />
        <StatCard
          title="Customers"
          value={formatNumber(summary.customersCount)}
          icon={Users}
        />
      </div>

      <MarketerMetricsTab
        timeline={metrics?.timeline ?? []}
        currency={currency}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        isProjectLoading={isContractsLoading}
        showProjectFilter={false}
        clicksTotal={summary.clicksCount}
        installsTotal={summary.installsCount}
      />
    </div>
  );
}
