"use client";

import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/data/metrics";
import { useMarketersLeaderboard } from "@/lib/hooks/marketer";
import { useProjectsLeaderboard } from "@/lib/hooks/projects";
import { getAvatarFallback, isAnonymousName } from "@/lib/utils/anonymous";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import React, { useRef, useState } from "react";
import { ComparisonSection } from "@/components/sections/comparison-section";

// Browser Preview component for consistency
function BrowserPreview() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pointer-events-none">
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
            alt="Dashboard Preview"
            fill
            className="object-cover object-left-top scale-100"
            priority
          />
        </div>
      </div>
    </div>
  );
}

// Helper components for the features sections
function FeatureSection({
  badge,
  title,
  description,
  items,
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

          <div className="pt-4">
            <Button size="lg" className="h-12 rounded-full px-8 bg-amber-500 text-white hover:bg-amber-600 font-bold border-none transition-all">
              Launch Program
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
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
    <main className="relative bg-white selection:bg-primary/10">
      <Navbar isTransparent forceTransparent={navbarForceTransparent} />

      {/* Hero with Scroll Transition */}
      <div ref={containerRef} className="relative h-[250vh]">
        <motion.div
          style={{ backgroundColor }}
          className="sticky top-0 h-screen w-full overflow-hidden"
        >
          {/* Subtle Background Elements (only visible on dark bg) */}
          <motion.div
            style={{ opacity: useTransform(scrollYProgress, [0, 0.4], [1, 0]) }}
            className="absolute inset-0"
          >
            <div className="absolute top-[10%] left-[10%] w-[80vw] h-[80vw] rounded-full border border-white/[0.02]" />
            <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full border border-white/[0.03]" />
          </motion.div>

          {/* Hero Content */}
          <motion.div
            style={{
              opacity: heroOpacity,
              scale: heroContentScale,
              pointerEvents: heroPointerEvents,
              y: -50 // Move text up
            }}
            className="h-full flex flex-col items-center justify-center mx-auto max-w-4xl px-6 relative z-40 pt-20"
          >
            <div className="flex flex-col items-center space-y-8">
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/40 tracking-wide uppercase">
                Marketplace Intelligence v2.0
              </Badge>

              <h1 className="text-[44px] md:text-[62px] font-semibold tracking-tighter leading-[1.05] text-white text-balance text-center">
                Scale with an <br />
                <span className="text-amber-400">Army of Sellers.</span>
              </h1>

              <p className="max-w-xl text-base md:text-lg text-white/40 leading-relaxed mx-auto text-center">
                The first marketplace that connects high-quality SaaS products with expert marketers. Makers build. Marketers sell. Everyone wins.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold border-none transition-all" asChild>
                  <Link href="/signup">
                    Get started
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base text-white border-white/10 hover:bg-white/5 font-bold transition-all" asChild>
                  <Link href="/login">View live demo</Link>
                </Button>
              </div>
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

        {/* Leaderboard Section */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-20 flex items-center justify-between">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black">Leaderboard</h2>
              <Link href="/projects" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors">
                View full directory <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Marketers */}
              <div className="space-y-8">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2">Top Marketers</div>
                <div className="space-y-3">
                  {topMarketers.slice(0, 5).map((marketer, i) => (
                    <Link
                      key={marketer.id}
                      href={`/marketers/${marketer.id}`}
                      className="flex items-center justify-between p-5 rounded-[1.8rem] bg-amber-50/40 transition-all hover:bg-amber-100/40 group block"
                    >
                      <div className="flex items-center gap-5">
                        <span className="text-[10px] font-bold text-amber-300 w-4">{i + 1}</span>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-none bg-amber-100 shadow-none">
                            <AvatarImage src={marketer.image || undefined} />
                            <AvatarFallback className="text-amber-500 text-[11px] font-extrabold">
                              {getAvatarFallback(marketer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-bold text-[15px] leading-tight text-black ${isAnonymousName(marketer.name) ? "blur-[2.5px] opacity-30 select-none" : ""}`}>
                              {marketer.name || "Anonymous"}
                            </p>
                            <div className="flex flex-col mt-0.5">
                              <p className="text-[11px] text-amber-400/80 font-bold uppercase tracking-wider leading-relaxed">{marketer.focus}</p>
                              <p className="text-[10px] text-black/20 font-medium">revshare.pm/{marketer.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[15px] text-black tracking-tight">{formatCurrency(marketer.revenue)}</p>
                        <p className="text-[10px] text-emerald-500 font-extrabold mt-1 tracking-wide uppercase">{marketer.trend}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-8">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2">Top Projects</div>
                <div className="space-y-3">
                  {topProjects.slice(0, 5).map((project, i) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between p-5 rounded-[1.8rem] bg-orange-50/40 transition-all hover:bg-orange-100/40 group block"
                    >
                      <div className="flex items-center gap-5">
                        <span className="text-[10px] font-bold text-orange-300 w-4">{i + 1}</span>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-orange-100 flex items-center justify-center shrink-0">
                            <Avatar className="h-full w-full border-none shadow-none rounded-none">
                              <AvatarImage src={getProjectAvatarUrl(project.name, project.logoUrl)} />
                              <AvatarFallback className="text-orange-500 text-[11px] font-extrabold">
                                {getAvatarFallback(project.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <p className={`font-bold text-[15px] leading-tight text-black ${isAnonymousName(project.name) ? "blur-[2.5px] opacity-30 select-none" : ""}`}>
                              {project.name}
                            </p>
                            <div className="flex flex-col mt-0.5">
                              <p className="text-[11px] text-orange-400/80 font-bold uppercase tracking-wider leading-relaxed">{project.category}</p>
                              <p className="text-[10px] text-black/20 font-medium">revshare.pm/{project.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[15px] text-black tracking-tight">{formatCurrency(project.revenue)}</p>
                        <p className="text-[10px] text-emerald-500 font-extrabold mt-1 tracking-wide uppercase">{project.growth}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ComparisonSection />

        {/* Dynamic Features mapped to FeatureSection */}
        <FeatureSection
          badge="Marketplace"
          title="Direct access to verified SaaS revenue."
          description="We've built the plumbing for the world's first true revenue-market. Browse high-quality SaaS products with verified Stripe revenue and immutable commission structures."
          items={["Verified data", "Direct connections", "Zero fees"]}
          visual={(progress) => (
            <div className="relative w-full max-w-sm aspect-square bg-amber-50/30 rounded-full flex items-center justify-center p-12">
              <div className="grid grid-cols-2 gap-4 w-full h-full">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    style={{ scale: useTransform(progress, [0.2, 0.4], [0.8, 1]), opacity: useTransform(progress, [0.2, 0.4], [0, 1]) }}
                    className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-4"
                  />
                ))}
              </div>
            </div>
          )}
        />

        <FeatureSection
          reversed
          badge="Compliance"
          title="Global scaling. Zero extra paperwork."
          description="Revenue is automatically split at the source. No more manual invoicing, no more chasing partners for payments. Stripe Connect handles the complexity so you can focus on building."
          items={["Automated payouts", "Tax compliance", "Global reach"]}
          visual={(progress) => (
            <div className="relative w-full max-w-sm aspect-square bg-emerald-50/30 rounded-full flex items-center justify-center p-12 overflow-hidden">
              <motion.div
                style={{ y: useTransform(progress, [0.2, 0.5], [100, 0]), opacity: useTransform(progress, [0.2, 0.4], [0, 1]) }}
                className="w-full h-3/4 bg-white rounded-t-3xl border-x border-t border-gray-100 p-6 flex flex-col gap-4"
              >
                <div className="h-2 w-24 bg-gray-100 rounded" />
                <div className="flex-1 space-y-3">
                  <div className="h-1.5 w-full bg-gray-50 rounded" />
                  <div className="h-1.5 w-full bg-gray-50 rounded" />
                  <div className="h-1.5 w-4/5 bg-gray-50 rounded" />
                </div>
                <div className="h-10 w-full bg-emerald-500 rounded-xl" />
              </motion.div>
            </div>
          )}
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
              {/* Creator Payout Console */}
              <div className="md:col-span-2 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between min-h-[320px]">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-black">Creator Payout Console</h3>
                  <p className="text-sm text-black/40">Track what’s owed, ready, and paid with receipts.</p>
                </div>
                <div className="mt-8 bg-white rounded-2xl p-4 space-y-3 shadow-sm border border-black/5">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-24 bg-black/5 rounded" />
                    <div className="h-2 w-12 bg-black/5 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-full bg-white rounded-xl border border-black/5" />
                    <div className="h-8 w-full bg-white rounded-xl border border-black/5" />
                  </div>
                </div>
              </div>

              {/* Contracting */}
              <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-black">Contracting</h3>
                  <p className="text-sm text-black/40">Approve contracts and set commissions.</p>
                </div>
                <div className="mt-8 bg-white rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-black/5">
                  <div className="h-1.5 w-full bg-black/5 rounded" />
                  <div className="h-1.5 w-4/5 bg-black/5 rounded" />
                  <div className="h-1.5 w-3/4 bg-black/5 rounded" />
                  <div className="h-8 w-full bg-amber-500 rounded-xl mt-2" />
                </div>
              </div>

              {/* Stripe Connect */}
              <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-2 text-black">Stripe Connect</h3>
                  <p className="text-sm text-black/40">Onboarding for all partners.</p>
                </div>
                <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
                </div>
              </div>

              {/* Row 2 */}
              {/* Smart Coupons */}
              <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between min-h-[280px]">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-black">Smart Coupons</h3>
                  <p className="text-sm text-black/40">Unique codes & attribution.</p>
                </div>
                <div className="mt-auto py-4 px-6 bg-white rounded-xl border-2 border-dashed border-black/5 text-center font-bold text-amber-500 tracking-widest text-lg shadow-sm">
                  BMK20
                </div>
              </div>

              {/* Public Dashboard */}
              <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-black">Public Dashboard</h3>
                  <p className="text-sm text-black/40">Showcase best performers.</p>
                </div>
                <div className="mt-8 flex items-end gap-1.5 h-20">
                  {[40, 70, 45, 90, 60].map((h, i) => (
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
                <div className="mt-8 space-y-2">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-black/5">
                    <p className="text-[9px] font-bold text-amber-500/60 uppercase">Sales</p>
                    <p className="text-sm font-bold text-black">$124.5k</p>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-xl text-white">
                    <p className="text-[9px] font-bold text-white/60 uppercase">Earnings</p>
                    <p className="text-sm font-bold text-white">$2.8k</p>
                  </div>
                </div>
              </div>

              {/* Auto Ledger */}
              <div className="md:col-span-1 p-8 rounded-[2rem] bg-[#F9F8F6] flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-black">Auto Ledger</h3>
                  <p className="text-sm text-black/40">Automated audit trail.</p>
                </div>
                <div className="mt-8 space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500/30" />
                      <div className="h-1.5 w-full bg-black/5 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Infrastructure Section */}
        <section className="py-24 bg-white border-t border-gray-50">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 max-w-2xl">
              <Badge variant="outline" className="rounded-full border-amber-500/10 bg-amber-50/50 px-3 py-1 text-[11px] font-bold text-amber-600 tracking-wide uppercase mb-4">
                Enterprise Ready
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
                Built for global scale
              </h2>
              <p className="text-black text-lg leading-relaxed">
                Connect your entire revenue ecosystem and monitor every conversion touchpoint with automated compliance and real-time intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Partner Approvals */}
              <div className="rounded-[2rem] bg-[#F9F8F6] overflow-hidden flex flex-col h-full">
                <div className="p-6">
                  <div className="h-[200px] shrink-0 relative p-8 flex items-center justify-center bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                    <div className="relative w-full h-full">
                      <Image
                        src="/approved-afil.png"
                        alt="Partner Approvals"
                        fill
                        className="object-contain drop-shadow-md"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 flex flex-col flex-1">
                  <h3 className="font-bold text-[17px] text-black mb-2">Automated Partner Approvals</h3>
                  <p className="text-[13px] text-black/40 leading-relaxed">
                    Set custom qualification rules and let our engine handle the vetting. Only high-quality partners get through.
                  </p>
                </div>
              </div>

              {/* Card 2: Compliance Ledger */}
              <div className="rounded-[2rem] bg-[#F9F8F6] overflow-hidden flex flex-col h-full">
                <div className="p-6">
                  <div className="h-[200px] shrink-0 relative p-8 flex items-center justify-center bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                    <div className="relative w-full h-full">
                      <Image
                        src="/audit-log-light.png"
                        alt="Compliance Ledger"
                        fill
                        className="object-contain drop-shadow-md"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 flex flex-col flex-1">
                  <h3 className="font-bold text-[17px] text-black mb-2">Immutable Compliance Ledger</h3>
                  <p className="text-[13px] text-black/40 leading-relaxed">
                    Every event, payout, and contract is signed and stored in a cryptographically secure audit trail.
                  </p>
                </div>
              </div>

              {/* Card 3: Growth Analytics */}
              <div className="rounded-[2rem] bg-[#F9F8F6] overflow-hidden flex flex-col h-full">
                <div className="p-6">
                  <div className="h-[200px] shrink-0 relative p-8 flex items-center justify-center bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                    <div className="relative w-full h-full">
                      <Image
                        src="/dash-stats-light.png"
                        alt="Growth Analytics"
                        fill
                        className="object-contain drop-shadow-md"
                      />
                    </div>
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

        <ExpandingCardSection />

        {/* Final CTA */}
        <section className="relative z-10 py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready to build the future of <br />
              <span className="text-amber-400">revenue sharing?</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-12 rounded-full px-8 text-base shadow-lg shadow-amber-500/20 transition-all font-bold bg-amber-400 text-white" asChild>
                <Link href="/signup">Get Started Now</Link>
              </Button>
            </div>
            <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
              Join the growing network of 1,200+ partners
            </p>
          </div>
        </section>

        <footer className="relative z-10 border-t border-gray-100 py-16 bg-gray-50/30">
          <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-amber-500 rounded flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">RevShare</span>
            </div>
            <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest">
              © 2026 RevShare Marketplace
            </p>
            <div className="flex gap-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </main >
  );
}
