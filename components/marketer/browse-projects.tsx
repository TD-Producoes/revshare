"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Percent, Timer, Check, Clock } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useProjects } from "@/lib/hooks/projects";
import { isAnonymousName } from "@/lib/utils/anonymous";
import {
  useContractsForMarketer,
  useCreateContract,
} from "@/lib/hooks/contracts";
import { ApplyToPromoteDialog } from "@/components/marketer/apply-to-promote-dialog";

export function BrowseProjects() {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);
  const createContract = useCreateContract();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [commissionInput, setCommissionInput] = useState<string>("");
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const [refundWindowInput, setRefundWindowInput] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [appliedProjectIds, setAppliedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );

  if (isAuthLoading || isUserLoading || isProjectsLoading || isContractsLoading) {
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

  const categories = Array.from(
    new Set(
      projects
        .map((project) => project.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  );
  const categoryOptions = categories.length ? categories : ["Other"];

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  const getRevSharePercent = (value?: string | number | null) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return numeric > 1 ? Math.round(numeric) : Math.round(numeric * 100);
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = project.category || "Other";
    const matchesCategory =
      categoryFilter === "all" || categoryFilter === categoryLabel;
    return matchesSearch && matchesCategory;
  });

  const getContractStatus = (projectId: string) => {
    const existingContract = contracts.find(
      (contract) => contract.projectId === projectId,
    );
    if (existingContract) {
      return existingContract.status;
    }
    if (appliedProjectIds.has(projectId)) {
      return "pending";
    }
    return null;
  };

  const handleOpenApply = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const defaultCommission = getRevSharePercent(
      project.marketerCommissionPercent,
    );
    setSelectedProjectId(projectId);
    setCommissionInput(defaultCommission !== null ? String(defaultCommission) : "");
    setRefundWindowInput(
      project.refundWindowDays != null ? String(project.refundWindowDays) : "30",
    );
    setApplicationMessage("");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSubmitContract = async () => {
    setFormError(null);
    if (!selectedProject || !currentUser) return;

    const commissionPercent = Number(commissionInput);
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0) {
      setFormError("Enter a valid commission percent.");
      return;
    }
    const refundWindowDays = refundWindowInput
      ? Number(refundWindowInput)
      : null;
    if (refundWindowDays !== null) {
      if (!Number.isFinite(refundWindowDays) || refundWindowDays < 0) {
        setFormError("Enter a valid refund window in days.");
        return;
      }
    }

    try {
      await createContract.mutateAsync({
        projectId: selectedProject.id,
        userId: currentUser.id,
        commissionPercent,
        message: applicationMessage.trim() || undefined,
        refundWindowDays: refundWindowDays ?? undefined,
      });
      setAppliedProjectIds((prev) => new Set(prev).add(selectedProject.id));
      setCommissionInput("");
      setRefundWindowInput("");
      setApplicationMessage("");
      setIsDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit request.";
      setFormError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse Projects</h1>
        <p className="text-muted-foreground">
          Find products to promote and earn commissions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No projects found matching your criteria.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const creatorName = project.user?.name || "Unknown";
            const categoryLabel = project.category || "Other";
            const offerStatus = getContractStatus(project.id);
            const revSharePercent =
              getRevSharePercent(project.marketerCommissionPercent);

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{categoryLabel}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Percent className="h-3 w-3" />
                      {revSharePercent !== null ? `${revSharePercent}%` : "-"} rev share
                    </Badge>
                  </div>
                  <CardTitle
                    className={`mt-2 ${
                      isAnonymousName(project.name)
                        ? "blur-xs opacity-60"
                        : ""
                    }`}
                  >
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description yet."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creator</span>
                      <span className="font-medium">
                        {creatorName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pricing Model</span>
                      <span className="font-medium capitalize">-</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        Cookie Window
                      </span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Public MRR</span>
                      <span className="font-medium">-</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {offerStatus === "approved" ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled
                    >
                      <Check className="h-4 w-4" />
                      Already Promoting
                    </Button>
                  ) : offerStatus === "pending" ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled
                    >
                      <Clock className="h-4 w-4" />
                      Application Pending
                    </Button>
                  ) : offerStatus === "rejected" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Application Rejected
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleOpenApply(project.id)}
                    >
                      Apply to Promote
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <ApplyToPromoteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        projectName={selectedProject?.name}
        commissionInput={commissionInput}
        onCommissionChange={setCommissionInput}
        refundWindowInput={refundWindowInput}
        onRefundWindowChange={setRefundWindowInput}
        applicationMessage={applicationMessage}
        onApplicationMessageChange={setApplicationMessage}
        onSubmit={handleSubmitContract}
        isSubmitting={createContract.isPending}
        submitDisabled={!selectedProject}
        formError={formError}
      />
    </div>
  );
}
