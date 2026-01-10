"use client";

import { ProjectDetail } from "@/components/creator/project-detail";
import { use } from "react";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProjectDetail projectId={id} />;
}
