"use client";

import * as React from "react";
import { motion, useScroll } from "framer-motion";
import { Zap, Shield, FileText, BarChart3, Users, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FoundersBentoGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4 text-balance">
            Everything you need to <span className="text-[#128045]">recruit an army</span>
          </h2>
          <p className="text-black/40 text-lg max-w-xl mx-auto">
            A full-stack infrastructure for high-performance revenue sharing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Contracts */}
          <div className="md:col-span-2 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black">Contract Negotiation</h3>
              <p className="text-sm text-black/40">Negotiate custom commission rates and refund windows with top marketers.</p>
            </div>
            <div className="mt-8 bg-white rounded-2xl p-4 space-y-3 shadow-sm border border-emerald-500/10">
              <div className="flex items-center justify-between">
                <div className="h-2 w-24 bg-emerald-500/10 rounded" />
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20">25% RATE</Badge>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-full bg-emerald-50/50 rounded-xl border border-emerald-500/10" />
                <div className="h-8 w-full bg-emerald-50/50 rounded-xl border border-emerald-500/10" />
              </div>
            </div>
          </div>

          {/* Reward Milestones */}
          <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black">Reward Milestones</h3>
              <p className="text-sm text-black/40">Automated bonuses for volume targets.</p>
            </div>
            <div className="mt-8 bg-white rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-emerald-500/10">
              <div className="h-1.5 w-full bg-emerald-100 rounded" />
              <div className="h-1.5 w-4/5 bg-emerald-100 rounded" />
              <div className="h-8 w-full bg-emerald-500 rounded-xl mt-2 flex items-center justify-center text-xs font-bold text-white">$500 BONUS</div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2 text-black">Immutable Logs</h3>
              <p className="text-sm text-black/40">Full transparency.</p>
            </div>
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
          </div>

          {/* Metrics */}
          <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col justify-between min-h-[280px]">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black">Live Metrics</h3>
              <p className="text-sm text-black/40">Compare channels.</p>
            </div>
            <div className="mt-auto py-4 px-6 bg-white rounded-xl border-2 border-dashed border-emerald-200 text-center font-bold text-emerald-600 tracking-widest text-lg shadow-sm">
              +42% MoM
            </div>
          </div>

          {/* Marketer Analytics */}
          <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black">Partner Intel</h3>
              <p className="text-sm text-black/40">See who's driving ROI.</p>
            </div>
            <div className="mt-8 flex items-end gap-1.5 h-20">
              {[40, 70, 45, 90, 60].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-emerald-500/30 rounded-t-lg" />
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black">Refund Buffers</h3>
              <p className="text-sm text-black/40">Protected payouts.</p>
            </div>
            <div className="mt-8 space-y-2">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-[#128045]/10">
                <p className="text-[9px] font-bold text-[#128045] uppercase tracking-tighter">Escrow</p>
                <p className="text-sm font-bold text-black">$85,420</p>
              </div>
              <div className="p-3 bg-[#128045] rounded-xl text-white">
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Verified</p>
                <p className="text-sm font-bold text-white">$42,150</p>
              </div>
            </div>
          </div>

          {/* Public Profiles */}
          <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F6F9F7] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black">Public Reach</h3>
              <p className="text-sm text-black/40">Visible to 1k+ pros.</p>
            </div>
            <div className="mt-8 flex -space-x-3 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#F6F9F7] bg-emerald-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


