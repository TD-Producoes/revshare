"use client";

import { ProjectsDirectory } from "@/components/projects/projects-directory";

/**
 * Marketer Projects Directory Page
 * Displays the projects directory within the marketer dashboard (with sidebar/header)
 */
export default function MarketerProjectsPage() {
  return (
    <ProjectsDirectory
      isPrivate={true}
      title="Project Directory"
      description="Discover and explore projects available for partnership"
      showBreadcrumbs={false}
      basePath="/marketer/projects"
    />
  );
}

