"use client";

import { ForceLightMode } from "@/components/force-light-mode";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProjectsDirectory } from "@/components/projects/projects-directory";

/**
 * Public Projects Directory Page
 */
export default function ProjectsDirectoryPage() {
  return (
    <>
      <ForceLightMode />
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl pt-24 px-6 py-8">
          <ProjectsDirectory />
        </div>
        <Footer className="bg-white" />
      </main>
    </>
  );
}
