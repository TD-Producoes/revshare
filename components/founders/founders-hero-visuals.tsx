"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Users, ShieldCheck, Wallet } from "lucide-react";

export function FoundersHeroCards() {
  return (
    <div className="flex flex-col md:flex-row items-end gap-5 max-w-5xl w-full px-4 mb-[-20px] scale-75 md:scale-80 transform-gpu">
      {/* Card 1: Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex-1 bg-[#11241A]/80 border border-white/5 rounded-xl p-5 text-left shadow-2xl backdrop-blur-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Partner Revenue</div>
          <div className="text-[10px] text-[#BFF2A0] font-bold">+14.2%</div>
        </div>
        <div className="flex items-end gap-1.5 h-32 mb-4">
          {[30, 45, 35, 60, 85, 75, 100].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1, delay: 1 + (i * 0.1), ease: "easeOut" }}
              className={`w-2 rounded-t-sm ${i === 6 ? 'bg-[#BFF2A0]' : 'bg-[#BFF2A0]/20'}`}
            />
          ))}
          <div className="h-full flex-1" />
        </div>
      </motion.div>

      {/* Card 2: Active Army (Center) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full md:w-[260px] bg-[#0B1710] border border-white/10 rounded-xl p-6 flex flex-col items-center shadow-2xl z-10"
      >
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Active Army</div>
        <div className="text-[11px] text-white/20 mb-4">January 2026</div>
        <div className="relative h-24 w-24 mb-4">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path className="text-white/5" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <motion.path
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: "85, 100" }}
              transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
              className="text-[#BFF2A0]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-6 w-6 text-[#BFF2A0]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white">1,240</div>
      </motion.div>

      {/* Card 3: Contract Status */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex-1 bg-[#11241A]/80 border border-white/5 rounded-xl p-5 text-left shadow-2xl backdrop-blur-lg"
      >
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Contract Status</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">Open Programs</span>
            <span className="text-white/80 font-medium">12</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">Avg Commission</span>
            <span className="text-[#BFF2A0] font-medium">22.5%</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">Refund Buffer</span>
            <span className="text-white/80 font-medium">30 Days</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function VisualToken({ label, sublabel, icon: Icon, className }: { label: string, sublabel?: string, icon?: any, className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border border-border/20 bg-background/90 p-2.5 shadow-sm backdrop-blur-sm ${className}`}>
      {Icon && (
        <div className="rounded bg-[#BFF2A0]/10 p-1.5 text-[#BFF2A0]">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-[12px] font-semibold text-white tracking-tight">{label}</span>
        {sublabel && <span className="text-[9px] text-white/70">{sublabel}</span>}
      </div>
    </div>
  );
}
