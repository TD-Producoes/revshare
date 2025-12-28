"use client";

import { useMemo } from "react";
import { ProjectsTable } from "./projects-table";
import { CreateProjectForm } from "./create-project-form";
import { useProjects, type ApiProject } from "@/lib/hooks/projects";
import { useAuthUserId } from "@/lib/hooks/auth";

function toPercent(value: ApiProject["marketerCommissionPercent"]) {
  const numeric =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(numeric)) return null;
  return numeric > 1 ? Math.round(numeric) : Math.round(numeric * 100);
}

export function ProjectsList() {
  const { data: authUserId } = useAuthUserId();
  const { data: projects = [] } = useProjects(authUserId);

  const projectsWithMetrics = useMemo(() => {
    return projects.map((project) => {
      const revSharePercent = toPercent(project.marketerCommissionPercent);

      return {
        id: project.id,
        name: project.name,
        userId: project.userId,
        ...(revSharePercent !== null ? { revSharePercent } : {}),
        metrics: null,
        marketerCount: null,
      };
    });
  }, [projects]);

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
