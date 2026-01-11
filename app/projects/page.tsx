"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PreviewBanner } from "@/components/preview/preview-banner";
import { PreviewProjectsDirectory } from "@/components/preview/preview-projects-directory";

/**
 * Public Projects Directory Page (Preview Mode)
 * Shows example projects with waitlist CTAs during pre-launch
 */
export default function ProjectsDirectoryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl pt-24 px-6 py-8">
        <PreviewProjectsDirectory />
      </div>
      <Footer className="bg-white" />
    </main>
  );
}
