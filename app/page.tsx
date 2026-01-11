"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LifecycleSection } from "@/components/sections/lifecycle-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/data/metrics";
import { useMarketersLeaderboard } from "@/lib/hooks/marketer";
import { useProjectsLeaderboard } from "@/lib/hooks/projects";
import { getAvatarFallback, isAnonymousName } from "@/lib/utils/anonymous";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { WaitlistModal } from "@/components/modals/waitlist-modal";
import { PreviewLeaderboards } from "@/components/preview/preview-leaderboards";

// Preview mode flag - set to false when launching with real data
const IS_PREVIEW_MODE = true;

// Skeleton Loader for Leaderboard Tables
function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number, columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-black/[0.03] last:border-none">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="py-5 px-2">
              <Skeleton className={j === 0 ? "h-4 w-4" : j === 1 ? "h-5 w-40" : "h-5 w-20 ms-auto"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Browser Preview component for consistency
function BrowserPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="w-full max-w-5xl mx-auto px-4 pointer-events-none"
    >
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
            src="/founder-dashboard-light.png"
            alt="Dashboard Preview"
            fill
            className="object-cover object-left-top scale-100"
            priority
          />
        </div>
      </div>
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Manage your entire partner ecosystem.</h2>
      </div>
    </motion.div>
  );
}

// Helper to get a consistent pastel color based on a string
const getPastelColor = (name: string) => {
  const colors = [
    'bg-blue-50',
    'bg-green-50',
    'bg-purple-50',
    'bg-rose-50',
    'bg-amber-50',
    'bg-cyan-50',
    'bg-indigo-50',
    'bg-teal-50',
  ];
  const textColors = [
    'text-blue-600',
    'text-green-600',
    'text-purple-600',
    'text-rose-600',
    'text-amber-600',
    'text-cyan-600',
    'text-indigo-600',
    'text-teal-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return { bg: colors[index], text: textColors[index] };
};

// Revenue Squares Visual Component (separate component to use hooks properly)
function RevenueSquaresVisual({ progress }: { progress: any }) {
  // Sample data for each square: MRR values and chart data
  const squaresData = [
    { mrr: 45200, chartData: [32, 38, 42, 45, 48, 45] },
    { mrr: 12800, chartData: [10, 12, 11, 13, 12, 13] },
    { mrr: 89500, chartData: [65, 72, 78, 82, 85, 90] },
    { mrr: 23400, chartData: [18, 20, 22, 21, 23, 23] },
  ];

  // Create transformed values (hooks can be used here since this is a component)
  const scale = useTransform(progress, [0.2, 0.4], [0.8, 1]);
  const opacity = useTransform(progress, [0.2, 0.4], [0, 1]);

  return (
    <div className="relative w-full max-w-sm aspect-square bg-amber-50/30 rounded-full flex items-center justify-center p-12">
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        {squaresData.map((data, i) => (
          <motion.div
            key={i}
            style={{
              scale,
              opacity
            }}
            className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col"
          >
            {/* Stripe Reference Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Stripe</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
            </div>

            {/* MRR Number */}
            <div className="mb-2">
              <p className="text-[10px] text-gray-400 font-medium mb-0.5">MRR</p>
              <p className="text-lg font-bold text-black leading-none">
                ${(data.mrr / 1000).toFixed(0)}k
              </p>
            </div>

            {/* Simple Bar Chart */}
            <div className="flex-1 flex items-end gap-0.5 mt-auto">
              {data.chartData.map((height, idx) => (
                <motion.div
                  key={idx}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{
                    delay: 0.3 + (idx * 0.05),
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                  className="flex-1 bg-gradient-to-t from-amber-500/80 to-amber-400/60 rounded-t-sm min-h-[2px]"
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Revenue Split Visual Component - Shows transaction and automatic money splitting
function RevenueSplitVisual({ progress }: { progress: any }) {
  // Create transformed values for animations (finish earlier in scroll)
  const transactionY = useTransform(progress, [0.2, 0.4], [100, 0]);
  const transactionOpacity = useTransform(progress, [0.2, 0.35], [0, 1]);
  const recipientsOpacity = useTransform(progress, [0.35, 0.5], [0, 1]);
  const recipientsY = useTransform(progress, [0.35, 0.5], [20, 0]);

  // Sample split data with explicit color classes
  const totalAmount = 1000;
  const splits = [
    { label: "Founder", amount: 700, bgColor: "bg-emerald-500/20", barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400" },
    { label: "Marketer", amount: 250, bgColor: "bg-amber-500/20", barColor: "bg-gradient-to-r from-amber-500 to-amber-400" },
    { label: "Platform", amount: 50, bgColor: "bg-blue-500/20", barColor: "bg-gradient-to-r from-blue-500 to-blue-400" },
  ];

  return (
    <div className="relative w-full max-w-sm aspect-square bg-emerald-50/30 rounded-full flex items-center justify-center p-8 overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 relative">
        {/* Transaction Card - Shows incoming payment */}
        <motion.div
          style={{
            y: transactionY,
            opacity: transactionOpacity
          }}
          className="w-full max-w-[280px] bg-white rounded-2xl border border-gray-100 p-4 z-10"
        >
          {/* Stripe Connect Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Stripe Connect</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Transaction Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">Payment Received</span>
              <span className="text-[11px] text-emerald-600 font-bold">✓ Verified</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-gray-400">Amount</span>
                <span className="text-xl font-bold text-black">${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Split Recipients - Shows money being distributed */}
        <motion.div
          style={{
            opacity: recipientsOpacity,
            y: recipientsY
          }}
          className="w-full grid grid-cols-3 gap-2"
        >
          {splits.map((split, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.6 + (i * 0.1),
                duration: 0.3
              }}
              className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center"
            >
              <div className={`h-1.5 w-full rounded-full mb-2 ${split.bgColor}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    delay: 0.8 + (i * 0.1),
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  className={`h-full rounded-full ${split.barColor}`}
                />
              </div>
              <p className="text-[9px] text-gray-500 font-medium mb-1">{split.label}</p>
              <p className="text-sm font-bold text-black">${split.amount}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// Helper components for the features sections
function FeatureSection({
  title,
  description,
  visual,
  reversed = false
}: {
  badge: string,
  title: string,
  description: string,
  items: string[],
  visual: (progress: any) => React.ReactNode,
  reversed?: boolean
}) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={sectionRef} className="relative z-10 py-10 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`space-y-6 ${reversed ? 'lg:order-2' : 'lg:order-1'}`}>
            <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight text-black text-balance">
              {title}
            </h2>
            <p className="text-black text-lg max-w-xl mx-auto">
              {description}
            </p>
          </div>
          <div className={`relative flex items-center ${reversed ? 'lg:order-1 justify-start' : 'lg:order-2 justify-end'}`}>
            {visual(scrollYProgress)}
          </div>
        </div>
      </div>
    </section>
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
  const borderRadius = useTransform(scrollYProgress, [0.4, 0.6], ["2rem", "0rem"]);
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
        className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden bg-[#24211A] text-white p-8 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.03)_0%,_transparent_70%)] opacity-40" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/60">
            Scale your infrastructure
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Stop coding payouts. <br />
            Start <span className="text-amber-400">scaling revenue.</span>
          </h2>

          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            The marketplace infrastructure for the next generation of SaaS.
            Automated, compliant, and ready for your army of sellers.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 rounded-full px-8 bg-amber-500 text-base text-white hover:bg-amber-600 font-bold border-none transition-all" asChild>
              <Link href="/solutions/for-founders">
                I&apos;m Founder
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base text-white border-white/10 hover:bg-white/5 font-bold transition-all" asChild>
              <Link href="/solutions/for-marketers">
                I&apos;m Marketer
              </Link>
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
        className="flex-1 bg-white/5 border border-white/5 rounded-xl p-5 text-left shadow-2xl backdrop-blur-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Revenue Flow</div>
          <div className="text-[10px] text-amber-500 font-bold">+12.4%</div>
        </div>
        <div className="flex items-end gap-1 h-32 mb-4">
          {[0.5, 0.7, 0.6, 0.9, 1, 0.8].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h * 100}%` }}
              transition={{ duration: 1, delay: 0.8 + (i * 0.1), ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-2 bg-amber-500/40 rounded-t-sm"
            />
          ))}
          <div className="h-full flex-1" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full md:w-[260px] bg-white/10 border border-white/10 rounded-xl p-6 flex flex-col items-center shadow-2xl z-10"
      >
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Total Shared</div>
        <div className="text-[11px] text-white/20 mb-4">Marketplace Volume</div>
        <div className="relative h-24 w-24 mb-4">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path className="text-white/5" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <motion.path
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: "85, 100" }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              className="text-amber-500"
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
              className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"
            />
          </div>
        </div>
        <div className="text-3xl font-bold text-white">$4.2M</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex-1 bg-white/5 border border-white/5 rounded-xl p-5 text-left shadow-2xl backdrop-blur-lg"
      >
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Active Distribution</div>
        <div className="space-y-3">
          {[
            { label: "Makers", value: "420", color: "text-white/80" },
            { label: "Marketers", value: "850+", color: "text-amber-500" },
            { label: "Integrations", value: "12", color: "text-white/80" }
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

// Helper function to generate avatar URL
function getProjectAvatarUrl(name: string, logoUrl: string | null): string {
  if (logoUrl) return logoUrl;
  const initials = name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["EC4899", "F59E0B", "2563EB", "8B5CF6", "10B981"];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors[colorIndex]}&color=fff`;
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [navbarForceTransparent, setNavbarForceTransparent] = useState(true);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const {
    data: topProjects = [],
    isLoading: isLoadingProjects,
  } = useProjectsLeaderboard();
  const { data: topMarketers = [], isLoading: isLoadingMarketers } =
    useMarketersLeaderboard();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroContentScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);
  const heroPointerEvents = useTransform(scrollYProgress, [0, 0.4], ["auto", "none"] as any);

  // Browser Animation Transforms
  const browserY = useTransform(scrollYProgress, [0, 0.7], ["55vh", "0vh"]);
  const browserScale = useTransform(scrollYProgress, [0, 0.7], [0.9, 1]);
  const browserOpacity = useTransform(scrollYProgress, [0, 0.3], [0.6, 1]);
  const backgroundColor = useTransform(scrollYProgress, [0.4, 0.7], ["#1F1C16", "#ffffff"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.6) {
      setNavbarForceTransparent(false);
    } else {
      setNavbarForceTransparent(true);
    }
  });

  return (
    <>
      <main className="relative bg-white selection:bg-primary/10">
        <Navbar isTransparent forceTransparent={navbarForceTransparent} />

        {/* Hero with Scroll Transition */}
        <div ref={containerRef} className="relative h-[250vh]">
          <motion.div
            style={{ backgroundColor }}
            className="sticky top-0 h-screen w-full overflow-hidden"
          >
            {/* Background circles with parallax and expansion entrance */}
            <motion.div
              style={{ opacity: useTransform(scrollYProgress, [0, 0.4], [1, 0]) }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {/* Outer Circle */}
              <motion.div
                style={{ y: useTransform(scrollYProgress, [0, 0.4], [0, -100]) }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] rounded-full border border-white/[0.02] border-dashed"
              />
              {/* Middle Circle */}
              <motion.div
                style={{ y: useTransform(scrollYProgress, [0, 0.4], [0, -60]) }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] rounded-full border border-white/[0.03]"
              />
              {/* Inner Circle */}
              <motion.div
                style={{ y: useTransform(scrollYProgress, [0, 0.4], [0, -30]) }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[65vw] h-[65vw] rounded-full border border-white/[0.04]"
              />
            </motion.div>

            {/* Hero Content */}
            <motion.div
              style={{
                opacity: heroOpacity,
                scale: heroContentScale,
                pointerEvents: heroPointerEvents,
              }}
              className="flex flex-col items-center mx-auto max-w-4xl px-6 relative z-40 pt-32 md:pt-48"
            >
              <div className="flex flex-col items-center space-y-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/40 tracking-wide uppercase">
                    Launch Special — Only 5% Platform Fee
                  </Badge>
                </motion.div>

                <motion.h1
                  className="text-[44px] md:text-[62px] font-semibold tracking-tighter leading-[1.05] text-white text-balance"
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
                  {"Scale fast with an".split(" ").map((word, i) => (
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
                  <br />
                  <span className="text-amber-400">
                    {"Army of Sellers.".split(" ").map((word, i) => (
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
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="max-w-xl text-base md:text-lg text-white/40 leading-relaxed mx-auto"
                >
                  A marketplace that connects high-quality Indie Hackers products with expert marketers. Makers build. Marketers sell. Everyone wins.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="flex flex-wrap items-center justify-center gap-4 pt-2"
                >
                  <Button
                    size="lg"
                    className="h-12 rounded-full px-8 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold border-none transition-all"
                    onClick={() => setIsWaitlistOpen(true)}
                  >
                    Join the Waitlist
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  {/* <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base text-white border-white/10 hover:bg-white/5 font-bold transition-all" asChild>
                    <Link href="/projects">Explore Projects</Link>
                  </Button> */}
                </motion.div>
              </div>
            </motion.div>

            {/* BROWSER PREVIEW TRANSITION */}
            <motion.div
              style={{
                y: browserY,
                scale: browserScale,
                opacity: browserOpacity
              }}
              className="absolute inset-0 flex items-center justify-center z-30 pt-20"
            >
              <BrowserPreview />
            </motion.div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-40 bg-white">

          {/* Leaderboard Section - Conditional Preview/Live */}
          {IS_PREVIEW_MODE ? (
            <PreviewLeaderboards />
          ) : (
            <section className="py-24">
              <div className="mx-auto max-w-7xl px-6">
                <div className="mb-12 px-4">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black">Leaderboard</h2>
                </div>

                {/* Side-by-side layout on large screens, stacked on smaller screens */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-4">
                  {/* Projects Table Card */}
                  <div className="bg-[#F9F8F6] rounded-[2.5rem] p-6 lg:p-8 flex-1 min-w-0">
                    <div className="flex items-center justify-between px-2 mb-6">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Top Startups</div>
                      <Link href="/projects" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold text-xs transition-colors">
                        Startup Directory <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="text-left pb-4 px-2 text-xs font-bold text-black/60 w-10">#</th>
                            <th className="text-left pb-4 px-2 text-xs font-bold text-black/60">Startup</th>
                            <th className="text-left pb-4 px-2 text-xs font-bold text-black/60 hidden xl:table-cell">Founder</th>
                            <th className="text-right pb-4 px-2 text-xs font-bold text-black/60">MRR</th>
                            <th className="text-right pb-4 px-2 text-xs font-bold text-black/60 w-24">Growth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.03]">
                          {isLoadingProjects ? (
                            <TableSkeleton rows={5} columns={5} />
                          ) : (
                            topProjects.slice(0, 10).map((project, i) => (
                              <tr key={project.id} className="group hover:bg-white/50 transition-colors">
                                <td className="py-3 px-2">
                                  <span className="text-[11px] font-bold text-gray-400">{i + 1}</span>
                                </td>
                                <td className="py-3 px-2">
                                  <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${getPastelColor(project.name || "Project").bg}`}>
                                      <Avatar className="h-full w-full border-none shadow-none rounded-none">
                                        <AvatarImage src={getProjectAvatarUrl(project.name, project.logoUrl)} />
                                        <AvatarFallback className={`text-[10px] font-extrabold ${getPastelColor(project.name || "Project").text}`}>
                                          {getAvatarFallback(project.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`font-bold text-[14px] leading-tight text-black flex items-center gap-2 ${isAnonymousName(project.name) ? "blur-[2.5px] opacity-30 select-none" : ""}`}>
                                        {project.name}
                                        {project.revenue > 10000 && (
                                          <Badge className="bg-amber-100/80 text-amber-700 hover:bg-amber-100 border-none text-[8px] font-bold px-1.5 h-4">top</Badge>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-gray-500 truncate max-w-[120px] lg:max-w-[150px] xl:max-w-[180px] mt-0.5">
                                        {project.description || "Leading the future of digital innovation."}
                                      </p>
                                    </div>
                                  </Link>
                                </td>
                                <td className="py-3 px-2 hidden xl:table-cell">
                                  {project.founder ? (
                                    <Link href={`/founders/${project.founder.id}`} className="flex items-center gap-2">
                                      <div className={`h-5 w-5 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${getPastelColor(project.founder.name || "U").bg}`}>
                                        <Avatar className="h-full w-full border-none shadow-none rounded-none">
                                          <AvatarImage src={project.founder.image || undefined} />
                                          <AvatarFallback className={`text-[8px] font-extrabold ${getPastelColor(project.founder.name || "U").text}`}>
                                            {getAvatarFallback(project.founder.name ?? "U")}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                      <span className="text-[13px] font-medium text-gray-700">{project.founder.name}</span>
                                    </Link>
                                  ) : (
                                    <span className="text-[13px] text-gray-300">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <p className="font-bold text-[14px] text-black tracking-tight">{formatCurrency(project.revenue)}</p>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <div className={`inline-flex items-center gap-1 text-[11px] font-bold ${project.growth.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}>
                                    {project.growth.startsWith("+") ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {project.growth.replace(/[+-]/, "")}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Marketers Table Card */}
                  <div className="bg-[#F9F8F6] rounded-[2.5rem] p-6 lg:p-8 flex-1 min-w-0">
                    <div className="flex items-center justify-between px-2 mb-6">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Top Marketers</div>
                      <Link href="/marketers" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-xs transition-colors">
                        Marketers <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="text-left pb-4 px-2 text-xs font-bold text-black/60 w-10">#</th>
                            <th className="text-left pb-4 px-2 text-xs font-bold text-black/60">Marketer</th>
                            <th className="text-left pb-4 px-2 text-xs font-bold text-black/60 hidden xl:table-cell">Focus</th>
                            <th className="text-right pb-4 px-2 text-xs font-bold text-black/60">Revenue</th>
                            <th className="text-right pb-4 px-2 text-xs font-bold text-black/60 w-24">Trend</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.03]">
                          {isLoadingMarketers ? (
                            <TableSkeleton rows={5} columns={5} />
                          ) : (
                            topMarketers.slice(0, 5).map((marketer, i) => (
                              <tr key={marketer.id} className="group hover:bg-white/50 transition-colors">
                                <td className="py-3 px-2">
                                  <span className="text-[11px] font-bold text-gray-400">{i + 1}</span>
                                </td>
                                <td className="py-3 px-2">
                                  <Link href={`/marketers/${marketer.id}`} className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${getPastelColor(marketer.name || "Anonymous").bg}`}>
                                      <Avatar className="h-full w-full border-none shadow-none rounded-none">
                                        <AvatarImage src={marketer.image || undefined} />
                                        <AvatarFallback className={`text-[10px] font-extrabold ${getPastelColor(marketer.name || "Anonymous").text}`}>
                                          {getAvatarFallback(marketer.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div>
                                      <p className={`font-bold text-[14px] leading-tight text-black ${isAnonymousName(marketer.name) ? "blur-[2.5px] opacity-30 select-none" : ""}`}>
                                        {marketer.name || "Anonymous"}
                                      </p>
                                    </div>
                                  </Link>
                                </td>
                                <td className="py-3 px-2 hidden xl:table-cell">
                                  <p className="text-[12px] text-gray-600 font-medium">{marketer.focus}</p>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <p className="font-bold text-[14px] text-black tracking-tight">{formatCurrency(marketer.revenue)}</p>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <div className={`inline-flex items-center gap-1 text-[11px] font-bold ${marketer.trend.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}>
                                    {marketer.trend.startsWith("+") ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {marketer.trend.replace(/[+-]/, "")}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Public Snapshot Stats */}
          <section className="py-12 border-y border-gray-50 bg-gray-50/20">
            <div className="mx-auto max-w-5xl px-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Revenue Shared", value: "$4.2M+" },
                  { label: "Active Partners", value: "850+" },
                  { label: "Payouts Processed", value: "12k+" },
                  { label: "Avg. Commission", value: "22%" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-black tracking-tight">{stat.value}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <LifecycleSection />

          {/* Dynamic Features mapped to FeatureSection */}
          <FeatureSection
            badge="Marketplace"
            title="Direct access to verified SaaS revenue."
            description="Stop guessing which products are actually making money. Browse projects with real Stripe revenue data and locked-in commission rates. No fluff, no fake numbers."
            items={["Verified data", "Direct connections", "Zero fees"]}
            visual={(progress) => <RevenueSquaresVisual progress={progress} />}
          />

          <FeatureSection
            reversed
            badge="Compliance"
            title="Global scaling. Zero extra paperwork."
            description="Revenue is automatically split at the source. No more manual invoicing, no more chasing partners for payments. Stripe Connect handles the complexity so you can focus on building."
            items={["Automated payouts", "Tax compliance", "Global reach"]}
            visual={(progress) => <RevenueSplitVisual progress={progress} />}
          />

          {/* Bento Features Grid */}
          <section className="py-24 bg-white">
            <div className="mx-auto max-w-5xl px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
                  Everything you need to scale revenue
                </h2>
                <p className="text-black text-lg max-w-xl mx-auto">
                  A complete toolkit for managing partnerships, payouts, and performance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Founder Payout Console */}
                <div className="md:col-span-2 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-black">Founder Payout Console</h3>
                    <p className="text-sm text-black/40">Track what&apos;s owed, ready, and paid with receipts.</p>
                  </div>
                  {/* macOS Window */}
                  <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* macOS Window Title Bar */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-[11px] text-gray-600 font-medium">Payouts</span>
                      </div>
                    </div>

                    {/* Window Content - Image */}
                    <div className="bg-white overflow-hidden">
                      <Image
                        src="/payouts-dashboard.png"
                        alt="Founder Payout Console - Payouts Dashboard"
                        width={1200}
                        height={800}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* Contracting */}
                <div className="md:col-span-2 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-black">Contracting</h3>
                    <p className="text-sm text-black/40">Approve contracts and set commissions.</p>
                  </div>
                  {/* Contract Document */}
                  <div className="mt-8 bg-white rounded-xl p-3 border border-gray-200 flex flex-col gap-2 relative overflow-hidden flex-1">
                    {/* Approved Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-2 w-2" />
                        APPROVED
                      </div>
                    </div>

                    {/* Contract Header */}
                    <div className="border-b border-gray-100 pb-1.5">
                      <h4 className="text-xs font-bold text-black mb-0.5">Revenue Share Agreement</h4>
                      <p className="text-[9px] text-gray-400 font-mono">#RS-2025-0428</p>
                    </div>

                    {/* Contract Terms */}
                    <div className="space-y-2 flex-1 relative">
                      {/* Fade out at bottom */}
                      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />

                      <div>
                        <p className="text-[9px] text-gray-500 mb-0.5">Parties</p>
                        <div className="text-[10px] text-black space-y-0.5">
                          <p className="font-medium">Founder: Flowceipt Inc.</p>
                          <p className="font-medium">Marketer: Tiago Mark</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-500 mb-0.5">Commission Structure</p>
                        <div className="bg-amber-50 rounded-lg p-1.5 border border-amber-100">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-gray-600">Commission Rate</span>
                            <span className="text-base font-bold text-amber-700">25%</span>
                          </div>
                          <p className="text-[9px] text-gray-500 mt-0.5">Of all referred revenue</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-500 mb-0.5">Terms</p>
                        <div className="text-[10px] text-gray-700 space-y-0.5">
                          <div className="flex items-start gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            <p>Payouts processed monthly</p>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            <p>30-day refund window applies</p>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            <p>Immutable commission structure</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signatures Section */}
                    <div className="border-t border-gray-200 pt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[9px] text-gray-500 mb-0.5">Founder Signature</p>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-14 bg-gray-100 rounded border border-gray-200" />
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </div>
                        </div>
                        <div className="flex-1 ml-2">
                          <p className="text-[9px] text-gray-500 mb-0.5">Marketer Signature</p>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-14 bg-gray-100 rounded border border-gray-200" />
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stripe Connect */}
                <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-black">Stripe Connect</h3>
                    <p className="text-sm text-black/40">Onboarding for all partners.</p>
                  </div>
                  <div className="mt-8 space-y-3">
                    {/* Connected Partner */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 ">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="py-2.5 px-4 bg-yellow-50 rounded-lg border-2 border-yellow-200 text-center">
                            <span className="font-bold text-yellow-600 text-base">Tiago Mark</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Status:</span>
                          <span className="font-semibold text-emerald-600">Connected</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Stripe ID:</span>
                          <span className="font-semibold text-black">acct_***</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Connected:</span>
                          <span className="font-semibold text-black">Dec 15, 2025</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-black">Tracking Codes</h3>
                    <p className="text-sm text-black/40">Unique codes & attribution.</p>
                  </div>
                  <div className="mt-auto">
                    <div className="py-4 px-6 bg-white rounded-xl border-2 border-dashed border-amber-500/30 text-center">
                      <span className="font-bold text-amber-500 tracking-widest text-lg">BMK20</span>
                    </div>
                  </div>
                </div>

                {/* Public Dashboard */}
                <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-black">Public Dashboard</h3>
                    <p className="text-sm text-black/40">Showcase best performers.</p>
                  </div>
                  <div className="mt-auto flex items-end gap-1.5 h-20">
                    {[40, 70, 45, 90].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-amber-500/20 rounded-t-lg" />
                    ))}
                  </div>
                </div>

                {/* Revenue & Earnings */}
                <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-black">Revenue & Earnings</h3>
                    <p className="text-sm text-black/40">Live maker & marketer stats.</p>
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <p className="text-[9px] font-bold text-amber-500/60 mb-1">Sales</p>
                      <p className="text-sm font-bold text-black">$124.5k</p>
                    </div>
                    <div className="p-3 bg-amber-500 rounded-xl text-white">
                      <p className="text-[9px] font-bold text-white/60 mb-1">Earnings</p>
                      <p className="text-sm font-bold text-white">$2.8k</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-24 bg-white border-t border-gray-50">
            <div className="mx-auto max-w-5xl px-6">
              <div className="mb-16 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
                  Built for global scale
                </h2>
                <p className="text-black text-lg leading-relaxed">
                  Connect your entire revenue and monitor every sales with automated compliance and real-time intelligence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1: Partner Approvals */}
                <div className="rounded-[2rem] bg-[#F9F8F6] overflow-hidden flex flex-col h-full">
                  <div className="p-6">
                    <div className="h-[200px] shrink-0 relative bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                      <Image
                        src="/approved-afil.png"
                        alt="Partner Approvals"
                        fill
                        className="object-cover"
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="px-8 pb-8 flex flex-col flex-1">
                    <h3 className="font-bold text-[17px] text-black mb-2">Auto-approve the good ones</h3>
                    <p className="text-[13px] text-black/40 leading-relaxed">
                      Set your rules. We filter. Only serious marketers get in.
                    </p>
                  </div>
                </div>

                {/* Card 2: Compliance Ledger */}
                <div className="rounded-[2rem] bg-[#F9F8F6] overflow-hidden flex flex-col h-full">
                  <div className="p-6">
                    <div className="h-[200px] shrink-0 relative bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                      <Image
                        src="/audit-log-light.png"
                        alt="Compliance Ledger"
                        fill
                        className="object-cover"
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="px-8 pb-8 flex flex-col flex-1">
                    <h3 className="font-bold text-[17px] text-black mb-2">Audit Trail You Can Trust</h3>
                    <p className="text-[13px] text-black/40 leading-relaxed">
                      Every sale, payout, and agreement is logged. Forever. Can't be changed.
                    </p>
                  </div>
                </div>

                {/* Card 3: Growth Analytics */}
                <div className="rounded-[2rem] bg-[#F9F8F6] overflow-hidden flex flex-col h-full">
                  <div className="p-6">
                    <div className="h-[200px] shrink-0 relative bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                      <Image
                        src="/dash-stats-light.png"
                        alt="Growth Analytics"
                        fill
                        className="object-cover"
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="px-8 pb-8 flex flex-col flex-1">
                    <h3 className="font-bold text-[17px] text-black mb-2">Advanced Growth Analytics</h3>
                    <p className="text-[13px] text-black/40 leading-relaxed">
                      Gain deep insights into your revenue waterfalls. Track attribution from the first click to the final payout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rewards & Incentives Section */}
          <section className="py-24 bg-white">
            <div className="mx-auto max-w-5xl px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-semibold  leading-[1.05] text-black text-balance mb-12">
                Reward marketers <br /> who actually sell
              </h2>

              <div className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-12 flex flex-col lg:flex-row items-center gap-10 text-left">
                {/* Left Visual: Reward Claim Card */}
                <div className="w-full lg:w-1/2 flex justify-center">
                  <div className="bg-white rounded-2xl w-full max-w-[340px] border border-black/5 relative overflow-hidden flex flex-col">
                    {/* macOS Window Header */}
                    <div className="bg-gray-50/80 border-b border-black/5 px-4 py-2.5 flex items-center relative">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] opacity-80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] opacity-80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] opacity-80" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[11px] text-gray-600 font-medium">Reward</span>
                      </div>
                    </div>

                    <div className="p-6 relative">
                      <div className="absolute top-6 right-6 bg-gray-100 px-2 py-0.5 rounded-full text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                        Claimed
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-black mb-0.5">1 month free</h3>
                        <p className="text-[11px] text-gray-400 font-medium">Unlock at: 1 completed sales</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-600">4 / 1</span>
                          <span className="text-[11px] font-bold text-gray-400">100%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-amber-400 rounded-full" />
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-[11px] font-bold text-gray-500 mb-3 uppercase tracking-tight">Reward: Free 3 months</p>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-600 font-mono">1MONTH-2AF61F3D</span>
                        </div>
                      </div>

                      <Button className="w-full h-11 bg-amber-400 hover:bg-amber-500 text-black font-bold text-sm rounded-lg shadow-md shadow-amber-400/10">
                        Claim reward
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-black leading-tight">
                    Give bonuses when they hit targets.
                  </h3>

                  <div className="space-y-4">
                    <ul className="space-y-4">
                      <li>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          <strong className="text-black">Milestone-based:</strong> Hit $10k? Get a bonus. It's automatic.
                        </p>
                      </li>
                      <li>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          <strong className="text-black">Consistent growth:</strong> Auto-generated coupons and perks keep your army of sellers motivated and engaged.
                        </p>
                      </li>
                      <li>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          <strong className="text-black">Refund protection:</strong> Rewards only unlock after refund windows close, ensuring you only reward real, verified value.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <ExpandingCardSection />

          <section className="relative z-10 py-24 text-center">
            <div className="mx-auto max-w-2xl px-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Ready to build the future of <br />
                <span className="text-amber-500 italic">revenue sharing?</span>
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" className="h-12 rounded-full px-8 text-base shadow-amber-500/20 transition-all font-bold bg-amber-400 text-white" asChild>
                  <Link href="/signup">Get Started Now</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                Join the growing network of 1,200+ partners
              </p>
            </div>
          </section>

          <Footer className="bg-gray-50/30" />
        </div>
      </main>

      <WaitlistModal isOpen={isWaitlistOpen} onOpenChange={setIsWaitlistOpen} />
    </>
  );
}
