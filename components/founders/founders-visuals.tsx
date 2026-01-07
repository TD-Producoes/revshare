"use client";

import { motion, useTransform } from "framer-motion";
import { LayoutGrid, Zap, Search, FileSearch, ShieldCheck, TrendingUp, Handshake, Target, BarChart3, Users } from "lucide-react";
import { VisualToken } from "./founders-hero-visuals";
import { Badge } from "@/components/ui/badge";

function CircularVisual({ children, color = "bg-emerald-500/5" }: { children: React.ReactNode, color?: string }) {
  return (
    <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full ${color} opacity-30`} />
      <div className={`relative w-[85%] h-[85%] rounded-full border border-border/20 ${color} flex items-center justify-center p-6 overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

export function RecruitmentVisual({ progress }: { progress: any }) {
  const x1 = useTransform(progress, [0.1, 0.3], [-100, 0]);
  const y1 = useTransform(progress, [0.1, 0.3], [100, 0]);
  const x2 = useTransform(progress, [0.15, 0.35], [100, 0]);
  const y2 = useTransform(progress, [0.15, 0.35], [-100, 0]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const scale = useTransform(progress, [0.1, 0.4], [0.5, 1]);

  return (
    <CircularVisual color="bg-emerald-500/5">
      <div className="grid grid-cols-2 gap-3 w-full p-4 relative">
        <motion.div style={{ x: x1, y: y1, opacity, scale }}>
          <VisualToken label="Top Marketers" sublabel="Verified only" icon={Users} className="translate-y-4" />
        </motion.div>
        <motion.div style={{ x: x2, y: y2, opacity, scale }}>
          <VisualToken label="Public Offer" sublabel="Visible to all" icon={Zap} className="-translate-y-4" />
        </motion.div>
      </div>
    </CircularVisual>
  );
}

export function NegotiationVisual({ progress }: { progress: any }) {
  const y1 = useTransform(progress, [0.1, 0.3], [100, 0]);
  const y2 = useTransform(progress, [0.15, 0.35], [120, 0]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const scale = useTransform(progress, [0.1, 0.4], [0.8, 1]);

  return (
    <CircularVisual color="bg-mint-500/5">
      <div className="flex flex-col gap-3 w-full px-4">
        <motion.div style={{ y: y1, opacity, scale }} className="flex justify-between items-center rounded-lg border border-border/30 bg-background/90 p-3 shadow-sm">
          <div className="flex gap-2.5 items-center">
            <Handshake className="h-4 w-4 text-emerald-500" />
            <span className="text-[13px] font-semibold">25% RevShare</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 text-emerald-500 border-emerald-500/20 bg-emerald-500/5">ACCEPTED</Badge>
        </motion.div>
        <motion.div style={{ y: y2, opacity, scale }} className="flex justify-between items-center rounded-lg border border-border/30 bg-background/90 p-3 shadow-sm opacity-60">
          <div className="flex gap-2.5 items-center">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-[13px] font-semibold">Milestone Bonus</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 text-blue-500 border-blue-500/20 bg-blue-500/5">PENDING</Badge>
        </motion.div>
      </div>
    </CircularVisual>
  );
}

export function AnalyticsVisual({ progress }: { progress: any }) {
  const yMain = useTransform(progress, [0.1, 0.35], [100, 0]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const scale = useTransform(progress, [0.1, 0.4], [0.85, 1]);

  return (
    <CircularVisual color="bg-blue-500/5">
      <div className="flex flex-col items-center gap-3 w-full px-4">
        <motion.div style={{ y: yMain, opacity, scale }} className="w-full rounded-xl border border-border/30 bg-background/95 p-5 shadow-lg">
          <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Affiliate Distribution</div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">42% of Total ARR</div>
          <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Top Performer</span>
              <span className="text-sm font-bold text-black">A. Markov</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">ROI Ratio</span>
              <span className="text-sm font-bold text-emerald-500">8.4x</span>
            </div>
          </div>
        </motion.div>
      </div>
    </CircularVisual>
  );
}
