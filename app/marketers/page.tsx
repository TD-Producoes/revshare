"use client";

import { Navbar } from "@/components/layout/navbar";
import { MarketersDirectory } from "@/components/marketers/marketers-directory";

/**
 * Public Marketers Directory Page
 * Displays the marketers directory with public navigation (Navbar)
 */
export default function MarketersDirectoryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl pt-24 px-6 py-8">
        <MarketersDirectory isPrivate={false} />
      </div>
    </main>
  );
}

