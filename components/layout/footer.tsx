"use client";

import Link from "next/link";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("relative z-10 border-t border-border/10 py-12 bg-gray-50/50", className)}>
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 font-semibold">
          <PieChart className="h-3.5 w-3.5" />
          <span className="text-lg tracking-tight">RevShare</span>
        </div>
        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest text-center md:text-left">
          © {new Date().getFullYear()} RevShare Marketplace
        </p>
        <div className="flex gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
