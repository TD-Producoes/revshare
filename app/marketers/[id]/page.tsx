"use client";

import { Navbar } from "@/components/layout/navbar";
import { MarketerDetail } from "@/components/marketers/marketer-detail";
import { use } from "react";

export default function MarketerProfilePage({
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
      <MarketerDetail marketerId={id} isPrivate={false} basePath="/marketers" />
    </main>
  );
}
