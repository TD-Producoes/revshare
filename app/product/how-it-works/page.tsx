"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import {
  ArrowUpRight,
  Zap,
  Search,
  ShieldCheck,
  Wallet,
  MousePointer2,
  Split,
  Lock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { FeatureSection } from "@/components/sections/feature-section";

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransparent, setIsTransparent] = React.useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.15) {
      setIsTransparent(false);
    } else {
      setIsTransparent(true);
    }
  });

  return (
    <main className="relative bg-white selection:bg-[#818CF8]/20">
      <Navbar isTransparent forceTransparent={isTransparent} theme="how-it-works" />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Indigo Blue Palette */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#0F172A] z-0"
          />

          {/* Background Decoration */}
          <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, -100]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] rounded-full border border-white/[0.03] border-dashed"
            />
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, -60]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] rounded-full border border-white/[0.05]"
            />
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, -30]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[65vw] h-[65vw] rounded-full border border-white/[0.08]"
            />
          </motion.div>

          <div className="mx-auto max-w-4xl px-6 relative z-10 text-center">
            <div className="flex flex-col items-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 tracking-wide uppercase">
                  Platform Lifecycle
                </Badge>
              </motion.div>

              <motion.h1
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
                className="text-[44px] md:text-[62px] tracking-tighter leading-[1.05] text-white text-balance text-center"
              >
                {"The lifecycle of a".split(" ").map((word, i) => (
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
                <br className="hidden md:block" />
                <span className="text-[#818CF8]">
                  {"partnership.".split(" ").map((word, i) => (
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
                className="max-w-2xl text-base md:text-lg text-white/70 leading-relaxed mx-auto text-center"
              >
                From first connection to verified payout. RevShare automates the trust layer between SaaS founders and performance marketers using verified Stripe data.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#818CF8] hover:bg-[#818CF8]/90 text-white font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(129,140,248,0.2)]" asChild>
                  <Link href="/signup">
                    Get Started
                    <div className="ml-2 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <ArrowUpRight className="h-4 w-4 text-white" />
                    </div>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Content */}
        <div className="py-24 space-y-24">
          <FeatureSection
            badge="Phase 1: Discovery"
            title="Transparent Marketplace Foundations."
            description="Founders publish projects with verified revenue data directly from Stripe. Marketers register and showcase their proven track record. Both remain discoverable through real-time public statistics."
            items={["Stripe-verified revenue", "Marketer public stats", "Open discovery directory"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#818CF8]/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-[#818CF8]/10">
                <motion.div
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-8 flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-indigo-50 rounded-lg flex items-center justify-center px-2">
                      <span className="text-[10px] font-bold text-[#818CF8]">STRIPE</span>
                    </div>
                    <div className="h-1 w-12 bg-gray-100 rounded" />
                  </div>
                  <div className="flex-1 space-y-4 pt-4">
                    <div className="space-y-1">
                      <div className="h-3 w-3/4 bg-gray-100 rounded" />
                      <div className="h-2 w-1/2 bg-gray-50 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <p className="text-[8px] text-indigo-400 font-bold uppercase">MRR</p>
                        <p className="text-xs font-bold text-indigo-900">$24.5k</p>
                      </div>
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <p className="text-[8px] text-indigo-400 font-bold uppercase">Rank</p>
                        <p className="text-xs font-bold text-indigo-900">Top 3%</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-full bg-[#0F172A] rounded-xl flex items-center justify-center">
                    <Search className="h-4 w-4 text-[#818CF8]" />
                  </div>
                </motion.div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Phase 2: Setup"
            title="Custom Parameters & Outreach."
            description="Founders set their own commission rates, performance rewards, and refund windows. Once matched, marketers receive unique coupon codes to share with their audience immediately."
            items={["Custom refund windows", "Performance rewards", "Instant coupon generation"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-indigo-500/5 rounded-full flex items-center justify-center p-8">
                <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
                  <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-black/5 space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-400">COMMISSION</span>
                        <span className="text-[#818CF8]">30%</span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-50 rounded-full">
                        <div className="h-full w-[30%] bg-[#818CF8] rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-400">REFUND WINDOW</span>
                        <span className="text-[#818CF8]">30 DAYS</span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-50 rounded-full">
                        <div className="h-full w-[100%] bg-[#818CF8] rounded-full" />
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="h-10 w-full bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center gap-2">
                        <MousePointer2 className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-mono font-bold text-gray-500 tracking-wider">REVSHARE_30_OFF</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />

          <FeatureSection
            badge="Phase 3: Execution"
            title="Automated Splitting & Rewards."
            description="All revenue is split transparently at the source. Payouts are released automatically once the refund window expires. Marketers earn additional rewards as they hit revenue, customer, or sales milestones."
            items={["Transparent splitting", "Automated payouts", "Milestone-based bonuses"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#818CF8]/5 rounded-full flex items-center justify-center p-12">
                <motion.div
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-8 flex flex-col gap-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-[#818CF8]" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-20 bg-gray-100 rounded" />
                      <div className="h-1.5 w-12 bg-emerald-500/20 rounded" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="p-3 bg-gray-50 rounded-xl border border-black/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold text-gray-400">REWARD PROGRESS</span>
                        <span className="text-[9px] font-bold text-emerald-500">80%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-black/5">
                        <motion.div
                          className="h-full bg-emerald-500"
                          initial={{ width: "20%" }}
                          animate={{ width: "80%" }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-10 w-full bg-[#0F172A] rounded-xl flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#818CF8]" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Bonus Unlocked</span>
                  </div>
                </motion.div>
              </div>
            )}
          />
        </div>

        {/* Global Components omitted to avoid repeating content from other pages */}
      </div>

      {/* Final CTA */}
      <section className="relative z-10 py-32 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <Badge variant="outline" className="mb-8 rounded-full border-black/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-black/40">
            Engineered for growth
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
            Stop manually handling payouts. <br />
            Start <span className="text-[#6366F1] italic">scaling your reach.</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-14 rounded-full px-10 text-base bg-[#0F172A] text-white hover:bg-black font-bold transition-all shadow-xl">
              Launch Program
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-base font-bold bg-white hover:bg-gray-50 transition-all border-black/5">
              Book Architecture Call
            </Button>
          </div>
          <p className="mt-12 text-[10px] text-black/30 font-bold uppercase tracking-[0.2em]">
            Stripe Connected Platform
          </p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/10 py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-[#0F172A] rounded flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">RevShare</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-bold">
            © 2026 RevShare Marketplace
          </p>
          <div className="flex gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[#6366F1] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#6366F1] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
