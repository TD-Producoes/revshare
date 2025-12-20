"use client";

import { useCurrentUser, useProjects, useOffers, useEvents } from "@/lib/data/store";
import { getProjectMetrics } from "@/lib/data/metrics";
import { ProjectsTable } from "./projects-table";
import { CreateProjectForm } from "./create-project-form";

export function ProjectsList() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const offers = useOffers();
  const events = useEvents();

  if (!currentUser || currentUser.role !== "creator") {
    return null;
  }

  const creatorProjects = projects.filter((p) => p.creatorId === currentUser.id);

  const projectsWithMetrics = creatorProjects.map((project) => {
    const projectMetrics = getProjectMetrics(events, project);
    const projectOffers = offers.filter(
      (o) => o.projectId === project.id && o.status === "approved"
    );

    return {
      ...project,
      metrics: projectMetrics,
      marketerCount: projectOffers.length,
    };
  });

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
