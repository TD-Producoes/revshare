"use client";

import { use } from "react";
import { Navbar } from "@/components/layout/navbar";
import { ProjectDetail } from "@/components/projects/project-detail";

/**
 * Public Project Detail Page
 * Displays the project detail with public navigation (Navbar)
 */
export default function ProjectProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <main className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />
      {/* Vertical Lines Background Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl border-x border-border/40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
      </div>
      <div className="relative z-10">
        <ProjectDetail projectId={id} isPrivate={false} basePath="/projects" />
      </div>
    </main>
  );
}
