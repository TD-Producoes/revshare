"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  CheckCircle2,
  Search,
  LayoutGrid,
  Zap,
  ShieldCheck,
  Sparkles,
  Wallet,
  FileSearch,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ComparisonSection } from "@/components/sections/comparison-section";
import { FeatureSection } from "@/components/sections/feature-section";

// Helper components for the features sections move to shared components/sections/feature-section.tsx

// Visual component inspired by the provided image (minimal, tokens in a circle)
function CircularVisual({ children, color = "bg-primary/5" }: { children: React.ReactNode, color?: string }) {
  return (
    <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full ${color} opacity-30`} />
      <div className={`relative w-[85%] h-[85%] rounded-full border border-border/20 ${color} flex items-center justify-center p-6 overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

// Specialized visual components for animations
function DiscoveryVisual({ progress }: { progress: any }) {
  const x1 = useTransform(progress, [0.1, 0.3], [-100, 0]);
  const y1 = useTransform(progress, [0.1, 0.3], [100, 0]);
  const x2 = useTransform(progress, [0.15, 0.35], [100, 0]);
  const y2 = useTransform(progress, [0.15, 0.35], [-100, 0]);
  const x3 = useTransform(progress, [0.2, 0.4], [-80, 0]);
  const y3 = useTransform(progress, [0.2, 0.4], [-80, 0]);
  const x4 = useTransform(progress, [0.25, 0.45], [80, 0]);
  const y4 = useTransform(progress, [0.25, 0.45], [80, 0]);
  const scale = useTransform(progress, [0.1, 0.4], [0.5, 1]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);

  return (
    <CircularVisual color="bg-indigo-500/5">
      <div className="grid grid-cols-2 gap-3 w-full p-4 relative">
        <motion.div style={{ x: x1, y: y1, opacity, scale }}>
          <VisualToken label="SaaS Analytics" sublabel="25% Commission" icon={LayoutGrid} className="translate-y-4" />
        </motion.div>
        <motion.div style={{ x: x2, y: y2, opacity, scale }}>
          <VisualToken label="Marketing AI" sublabel="20% Commission" icon={Zap} className="-translate-y-4" />
        </motion.div>
        <motion.div style={{ x: x3, y: y3, opacity, scale }}>
          <VisualToken label="CRM Tools" sublabel="30% Commission" icon={Search} className="translate-y-2" />
        </motion.div>
        <motion.div style={{ x: x4, y: y4, opacity, scale }}>
          <VisualToken label="Dev Tools" sublabel="15% Commission" icon={FileSearch} className="-translate-y-2" />
        </motion.div>
      </div>
    </CircularVisual>
  );
}

function ManagementVisual({ progress }: { progress: any }) {
  const y1 = useTransform(progress, [0.1, 0.3], [100, 0]);
  const y2 = useTransform(progress, [0.15, 0.35], [120, 0]);
  const y3 = useTransform(progress, [0.2, 0.4], [140, 0]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const scale = useTransform(progress, [0.1, 0.4], [0.8, 1]);

  return (
    <CircularVisual color="bg-emerald-500/5">
      <div className="flex flex-col gap-3 w-full px-4">
        <motion.div style={{ y: y1, opacity, scale }} className="flex justify-between items-center rounded-lg border border-border/30 bg-background/90 p-3 shadow-sm">
          <div className="flex gap-2.5 items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[13px] font-semibold">FlowMetrics Pro</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 text-emerald-500 border-emerald-500/20 bg-emerald-500/5">APPROVED</Badge>
        </motion.div>
        <motion.div style={{ y: y2, opacity, scale }} className="flex justify-between items-center rounded-lg border border-border/30 bg-background/90 p-3 shadow-sm opacity-60">
          <div className="flex gap-2.5 items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[13px] font-semibold">CopyGenius AI</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 text-amber-500 border-amber-500/20 bg-amber-500/5">PENDING</Badge>
        </motion.div>
        <motion.div style={{ y: y3, opacity, scale }} className="flex justify-between items-center rounded-lg border border-border/30 bg-background/90 p-3 shadow-sm">
          <div className="flex gap-2.5 items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[13px] font-semibold">BuildStack Teams</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 text-primary border-primary/20 bg-primary/5">NEW MATCH</Badge>
        </motion.div>
      </div>
    </CircularVisual>
  );
}

function TransparencyVisual({ progress }: { progress: any }) {
  const yMain = useTransform(progress, [0.1, 0.35], [100, 0]);
  const ySub = useTransform(progress, [0.2, 0.45], [80, 0]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const scale = useTransform(progress, [0.1, 0.4], [0.85, 1]);

  return (
    <CircularVisual color="bg-blue-500/5">
      <div className="flex flex-col items-center gap-3 w-full px-4">
        <motion.div style={{ y: yMain, opacity, scale }} className="w-full rounded-xl border border-border/30 bg-background/95 p-5 shadow-lg">
          <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Estimated Earnings</div>
          <div className="text-2xl font-bold tracking-tight">$4,280.50</div>
          <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Available</span>
              <span className="text-sm font-bold text-emerald-500">$3,120.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Pending</span>
              <span className="text-sm font-bold text-amber-500">$1,160.50</span>
            </div>
          </div>
        </motion.div>
        <motion.div style={{ y: ySub, opacity, scale: useTransform(progress, [0.2, 0.5], [0.5, 1]) }} className="w-full flex justify-center">
          <VisualToken label="Recent Sale: $42.00" sublabel="2 mins ago" icon={TrendingUp} className="w-fit" />
        </motion.div>
      </div>
    </CircularVisual>
  );
}

function ReliabilityVisual({ progress }: { progress: any }) {
  const x1 = useTransform(progress, [0.1, 0.3], [-120, 0]);
  const x2 = useTransform(progress, [0.15, 0.35], [120, 0]);
  const x3 = useTransform(progress, [0.2, 0.4], [-100, 0]);
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const scale = useTransform(progress, [0.1, 0.4], [0.8, 1]);

  return (
    <CircularVisual color="bg-orange-500/5">
      <div className="flex flex-col gap-3 w-full px-4">
        <motion.div style={{ x: x1, opacity, scale }} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/95 shadow-sm">
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold">$1,250.00</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Paid Jan 15</div>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </motion.div>
        <motion.div style={{ x: x2, opacity, scale }} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-background/95 shadow-md">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold">$840.25</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Processing Feb 15</div>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        </motion.div>
      </div>
    </CircularVisual>
  );
}

// Token individual items for the visual
function VisualToken({ label, sublabel, icon: Icon, className }: { label: string, sublabel?: string, icon?: any, className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border border-border/20 bg-background/90 p-2.5 shadow-sm backdrop-blur-sm ${className}`}>
      {Icon && (
        <div className="rounded bg-primary/10 p-1.5 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-[12px] font-semibold text-foreground tracking-tight">{label}</span>
        {sublabel && <span className="text-[9px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}

// Card to fullscreen transition
function ExpandingCardSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0.3, 0.6], [0.95, 1]);
  const borderRadius = useTransform(scrollYProgress, [0.4, 0.6], ["1.5rem", "0rem"]);
  const marginSide = useTransform(scrollYProgress, [0.3, 0.6], ["3%", "0%"]);

  return (
    <section ref={containerRef} className="relative z-20 py-16 lg:py-32 bg-background">
      <motion.div
        style={{
          scale,
          borderRadius,
          marginLeft: marginSide,
          marginRight: marginSide,
        }}
        className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden bg-[#3D2B1F] text-white p-8 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)] opacity-40" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/60">
            Scale your performance
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Turn distribution <br />
            into <span className="text-[#FFB347]">recurring revenue.</span>
          </h2>

          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Join the elite circle of marketers earning over $4.2M in aggregate commissions.
            No gatekeepers. Just results.
          </p>

          <div className="pt-4">
            <Button size="lg" className="h-12 rounded-full px-8 bg-[#FFB347] text-[#3D2B1F] hover:bg-[#FFA500] font-bold">
              Join the Network
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// Hero Dashboard Components
function HeroDashboardCards() {
  return (
    <div className="flex flex-col md:flex-row items-end gap-5 max-w-5xl w-full px-4 mb-[-20px] scale-75 md:scale-80 transform-gpu">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex-1 bg-[#4A3728]/80 border border-white/5 rounded-xl p-5 text-left shadow-2xl backdrop-blur-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Cash Flow</div>
          <div className="text-[10px] text-[#FFB347] font-bold">+9.5%</div>
        </div>
        <div className="flex items-end gap-1 h-32 mb-4">
          {[0.4, 0.6, 0.5, 0.8, 1, 0.9].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h * 100}%` }}
              transition={{ duration: 1, delay: 0.8 + (i * 0.1), ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-2 bg-[#FFB347]/40 rounded-t-sm"
            />
          ))}
          <div className="h-full flex-1" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full md:w-[260px] bg-[#5C4533] border border-white/10 rounded-xl p-6 flex flex-col items-center shadow-2xl z-10"
      >
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Revenue</div>
        <div className="text-[11px] text-white/20 mb-4">November 2024</div>
        <div className="relative h-24 w-24 mb-4">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path className="text-white/5" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <motion.path
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: "75, 100" }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              className="text-[#FFB347]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="h-2 w-2 rounded-full bg-[#FFB347] shadow-[0_0_10px_#FFB347]"
            />
          </div>
        </div>
        <div className="text-3xl font-bold text-white">$2.8M</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex-1 bg-[#4A3728]/80 border border-white/5 rounded-xl p-5 text-left shadow-2xl backdrop-blur-lg"
      >
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Performance</div>
        <div className="space-y-3">
          {[
            { label: "Revenue", value: "$5.5M", color: "text-white/80" },
            { label: "Commission", value: "$1.0M", color: "text-[#FFB347]" },
            { label: "Active Offers", value: "124", color: "text-white/80" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + (i * 0.1) }}
              className="flex justify-between items-center text-[11px]"
            >
              <span className="text-white/40">{item.label}</span>
              <span className={cn(item.color, "font-medium")}>{item.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Browser Window Preview revealed inside the white circle
function BrowserPreview({ progress }: { progress: any }) {
  const opacity = useTransform(progress, [0.4, 0.6], [0, 1]);
  const scale = useTransform(progress, [0.4, 0.7], [0.8, 0.9]);
  const y = useTransform(progress, [0.4, 0.7], [40, 0]);

  return (
    <motion.div
      style={{ opacity, scale, y }}
      className="absolute inset-0 flex flex-col items-center justify-center z-30 pt-20 px-6 pointer-events-none"
    >
      <div className="w-full max-w-4xl group">
        <div className="bg-white rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-border/40 overflow-hidden transform-gpu transition-all duration-700">
          {/* macOS Browser Header */}
          <div className="h-10 bg-gray-50/50 border-b border-border/40 flex items-center px-4 gap-2">
            <div className="flex gap-1.5 grayscale opacity-40">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="h-6 w-1/2 bg-white rounded-md border border-border/40 flex items-center px-3 gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500/20" />
                <div className="h-1.5 w-24 bg-gray-100 rounded-full" />
              </div>
            </div>
          </div>
          {/* Main Dashboard Image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-white">
            <Image
              src="/marketer-dashboard.png"
              alt="Marketer Dashboard"
              fill
              className="object-cover object-left-top scale-100"
              priority
            />
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Everything in one place. No exceptions.</h2>
      </div>
    </motion.div>
  );
}

export default function ForMarketers() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [navbarForceTransparent, setNavbarForceTransparent] = useState(true);
  const [navbarHideDashboard, setNavbarHideDashboard] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const heroContentScale = useTransform(scrollYProgress, [0, 0.45], [1, 0.95]);
  const heroPointerEvents = useTransform(scrollYProgress, [0, 0.45], ["auto", "none"] as any);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Hide dashboard button when the circle reveal is passing through the top-right corner
    if (latest > 0.35 && latest < 0.45) {
      setNavbarHideDashboard(true);
    } else {
      setNavbarHideDashboard(false);
    }

    if (latest > 0.45) {
      setNavbarForceTransparent(false);
    } else {
      setNavbarForceTransparent(true);
    }
  });

  return (
    <main className="relative bg-white selection:bg-primary/10">
      <Navbar isTransparent forceTransparent={navbarForceTransparent} isDashboardHidden={navbarHideDashboard} />

      {/* Hero with Reveal Animation */}
      <div ref={containerRef} className="relative h-[250vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#3D2B1F]">
          {/* Background circles with parallax and expansion entrance */}
          <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Outer Circle */}
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.45], [0, -100]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] rounded-full border border-white/[0.03] border-dashed"
            />
            {/* Middle Circle */}
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.45], [0, -60]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] rounded-full border border-white/[0.05]"
            />
            {/* Inner Circle */}
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.45], [0, -30]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[65vw] h-[65vw] rounded-full border border-white/[0.08]"
            />
          </motion.div>

          {/* Hero Content that fades out - Higher Z-INDEX (40) initially */}
          <motion.div
            style={{ opacity: heroOpacity, scale: heroContentScale, pointerEvents: heroPointerEvents }}
            className="h-full flex flex-col items-center justify-center mx-auto max-w-4xl px-6 relative z-40 pt-[290px]"
          >
            <div className="flex flex-col items-center space-y-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/50 tracking-wide uppercase">
                  Marketer Alpha
                </Badge>
              </motion.div>

              <motion.h1
                className="text-[44px] md:text-[62px] tracking-tighter leading-[1.05] text-white text-balance"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.2
                    }
                  }
                }}
              >
                {"Market what you love. Get paid what you're".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-[0.2em] last:mr-0"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                  >
                    {word}
                  </motion.span>
                ))}
                <span className="text-[#FFB347]">
                  {"worth.".split(" ").map((word, i) => (
                    <motion.span
                      key={i}
                      className="inline-block ml-[0.2em]"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="max-w-xl text-base md:text-lg text-white/50 leading-relaxed mx-auto"
              >
                Stop hunting for affiliate links. Browse verified programs, track your performance with full transparency, and earn recurring commissions as your sales grow.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold border-none transition-all" asChild>
                  <Link href="/projects">
                    Explore programs
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base text-white border-white/10 hover:bg-white/5 font-bold transition-all" asChild>
                  <Link href="/signup">Create profile</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.4 }}
                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12px] text-white/30 pt-6 font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB347]/40" />
                  <span>Zero fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB347]/40" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB347]/40" />
                  <span>Stripe Payouts</span>
                </div>
              </motion.div>
            </div>

            <div className="mt-16 w-full flex justify-center pb-12">
              <HeroDashboardCards />
            </div>
          </motion.div>

          {/* CIRCULAR REVEAL OVERLAY - Z-INDEX (30) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <motion.div
              style={{ scale: useTransform(scrollYProgress, [0, 0.45, 0.9], [0, 1.2, 10]) }}
              className="w-[100vw] h-[100vw] rounded-full bg-white will-change-transform"
            />
          </div>

          {/* CONTENT INSIDE THE REVEAL - Z-INDEX (20) and POINTER-EVENTS-NONE */}
          <BrowserPreview progress={scrollYProgress} />
        </div>
      </div>

      {/* Main Content Area (White Background) */}
      <div className="relative z-40 bg-white">
        <ComparisonSection />
        {/* Features Area */}
        <FeatureSection
          badge="Discovery"
          title="Direct access to top SaaS offers."
          description="Filter deals by commission rate, historical revenue, and payout frequency. No more hunting for affiliate managers on LinkedIn."
          items={["Verified programs", "Direct connections", "High-ticket offers"]}
          visual={(progress) => <DiscoveryVisual progress={progress} />}
        />

        <FeatureSection
          reversed
          badge="Management"
          title="All your links in one command center."
          description="Consolidate multiple programs into a single dashboard. Manage approvals, creative assets, and tracking links without switching tabs."
          items={["Unified dashboard", "Instant assets", "One-click apply"]}
          visual={(progress) => <ManagementVisual progress={progress} />}
        />

        <FeatureSection
          badge="Transparency"
          title="Audit every cent in real-time."
          description="Full granular visibility into every conversion. We sync directly with the source so you see exactly what the founder sees."
          items={["Conversion logs", "Revenue sync", "Immutable tracking"]}
          visual={(progress) => <TransparencyVisual progress={progress} />}
        />

        <ExpandingCardSection />

        <section className="relative z-10 py-24 text-center bg-gray-50/50">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Start building your performance <br />
              <span className="text-primary italic">portfolio today.</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all border-none shadow-none" asChild>
                <Link href="/signup">Explore Projects Now</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Join 850+ high-performance marketers
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
