"use client";

import { useMemo } from "react";
import { ProjectsTable } from "./projects-table";
import { CreateProjectForm } from "./create-project-form";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useCreatorDashboard } from "@/lib/hooks/creator";

function toPercent(value: string | number | null | undefined) {
  const numeric =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(numeric)) return null;
  return numeric > 1 ? Math.round(numeric) : Math.round(numeric * 100);
}

export function ProjectsList() {
  const { data: authUserId } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data, isLoading: isDashboardLoading } = useCreatorDashboard(
    currentUser?.id,
  );

  const projectsWithMetrics = useMemo(() => {
    return (
      data?.projects?.map((project) => {
        const revSharePercent = toPercent(project.marketerCommissionPercent);

        return {
          id: project.id,
          name: project.name,
          userId: project.userId,
          ...(revSharePercent !== null ? { revSharePercent } : {}),
          metrics: project.metrics,
          marketerCount: project.marketerCount,
          category: project.category ?? "Other",
        };
      }) ?? []
    );
  }, [data?.projects]);

  if (isUserLoading || isDashboardLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "creator") {
    return (
      <div className="text-muted-foreground">
        This section is only available to creators.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your products and revenue sharing terms.
          </p>
        </div>
        <CreateProjectForm />
      </div>

      <ProjectsTable projects={projectsWithMetrics} />
    </div>
  );
}
