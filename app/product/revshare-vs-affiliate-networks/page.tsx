"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { ArrowUpRight, Zap, CheckCircle2, Search, LayoutGrid, ShieldCheck, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureSection } from "@/components/sections/feature-section";
import { ComparisonTable } from "@/components/sections/comparison-table";
import { PainPointsSection } from "@/components/sections/pain-points-section";
import Image from "next/image";



export default function RevShareVsAffiliates() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransparent, setIsTransparent] = React.useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Switch to solid navbar as soon as we leave the hero section
    if (latest > 0.15) {
      setIsTransparent(false);
    } else {
      setIsTransparent(true);
    }
  });

  return (
    <main className="relative bg-white selection:bg-[#BFF2A0]/20">
      <Navbar isTransparent forceTransparent={isTransparent} theme="founders" />

      <div ref={containerRef}>
        {/* Hero Section - Inspired by Campfire */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#0B1710] z-0"
          />

          {/* Background Decoration - Circles with parallax */}
          <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Outer Circle */}
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, -100]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] rounded-full border border-white/[0.03] border-dashed"
            />
            {/* Middle Circle */}
            <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, -60]) }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] rounded-full border border-white/[0.05]"
            />
            {/* Inner Circle */}
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
                  Platform Comparison
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
                {"Built for your next stage of".split(" ").map((word, i) => (
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
                <span className="text-[#BFF2A0]">
                  {"growth.".split(" ").map((word, i) => (
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
                className="max-w-xl text-base md:text-lg text-white/70 leading-relaxed mx-auto text-center"
              >
                Traditional affiliate networks were built for links and cookies. RevShare is built for actual revenue, transparency, and long-term SaaS partnerships.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#BFF2A0] hover:bg-[#BFF2A0]/90 text-[#0B1710] font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(191,242,160,0.2)]" asChild>
                  <Link href="/signup">
                    Get Started
                    <div className="ml-2 h-7 w-7 rounded-full bg-[#0B1710]/10 flex items-center justify-center group-hover:bg-[#0B1710]/20">
                      <ArrowUpRight className="h-4 w-4 text-[#0B1710]" />
                    </div>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <div className="py-24 space-y-24">
          <FeatureSection
            badge="Revenue-First"
            title="Real revenue, not just clicks."
            description="RevShare tracks actual revenue generated, not just last-touch attribution. Commissions unlock only after the refund window ends — protecting both founders and marketers."
            items={["Net revenue tracking", "Refund-aware logic", "Secure settlements"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-emerald-500/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-emerald-500/10">
                <motion.div
                  style={{ y: 20, opacity: 1 }}
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-8 flex flex-col gap-6"
                >
                  <div className="h-1 w-24 bg-emerald-500/20 rounded" />
                  <div className="flex-1 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="h-2 w-32 bg-gray-100 rounded" />
                        <div className="h-2 w-12 bg-emerald-500/20 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="h-12 w-full bg-[#0B1710] rounded-xl flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-[#BFF2A0]" />
                  </div>
                </motion.div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Discovery"
            title="A real marketplace for partnerships."
            description="Instead of hidden programs behind network logins, RevShare projects are publicly discoverable. Marketers can showcase verified performance and founders can find the best partners faster."
            items={["Public leaderboard", "Verified profiles", "Direct applications"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#BFF2A0]/10 rounded-full flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-2xl shadow-xl border border-black/5 p-4 flex flex-col items-center justify-center gap-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-100" />
                      <div className="h-1 w-12 bg-emerald-500/20 rounded" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          />
        </div>

        {/* Pain Points Section - Now appearing later */}
        <PainPointsSection />

        {/* Comparison Table */}
        <ComparisonTable />
      </div>

      <section className="relative z-10 py-24 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Stop coding black boxes. <br />
            Start <span className="text-[#128045] italic">scaling trust.</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#BFF2A0] hover:bg-[#BFF2A0]/90 text-[#0B1710] font-bold transition-all border-none shadow-none" asChild>
              <Link href="/signup">Launch Your Program Now</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            No subscriptions. No upfront fees.
          </p>
        </div>
      </section>

      <Footer className="bg-white" theme="affiliate-networks" />
    </main>
  );
}
