"use client";

import { ForceLightMode } from "@/components/force-light-mode";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PreviewBanner } from "@/components/preview/preview-banner";
import { PreviewMarketersDirectory } from "@/components/preview/preview-marketers-directory";

/**
 * Public Marketers Directory Page (Preview Mode)
 * Shows example marketer profiles with waitlist CTAs during pre-launch
 */
export default function MarketersDirectoryPage() {
  return (
    <>
      <ForceLightMode />
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl pt-24 px-6 py-8">
          <PreviewMarketersDirectory />
        </div>
        <Footer className="bg-white" />
      </main>
    </>
  );
}
