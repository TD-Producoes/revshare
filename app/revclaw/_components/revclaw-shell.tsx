import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function RevclawShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-black text-white",
        className,
      )}
      style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
    >
      {/* Background (match /revclaw) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
        <div className="absolute inset-0 opacity-90 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.25),transparent_55%)]" />
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.18),transparent_60%)]" />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-3xl px-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} RevShare • RevClaw is experimental.
        </div>
      </footer>
    </div>
  );
}
