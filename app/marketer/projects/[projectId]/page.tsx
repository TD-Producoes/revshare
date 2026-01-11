"use client";

import { use } from "react";
import { ProjectDetail } from "@/components/projects/project-detail";

/**
 * Marketer Project Detail Page
 * Displays the project detail within the marketer dashboard (with sidebar/header)
 */
export default function MarketerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return (
    <ProjectDetail
      projectId={projectId}
      isPrivate={true}
      basePath="/marketer/projects"
    />
  );
}
