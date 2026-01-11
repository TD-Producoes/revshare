"use client";

import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FoundersHeroCards } from "@/components/founders/founders-hero-visuals";
import { FoundersBentoGrid } from "@/components/founders/founders-features";
import { FeatureSection } from "@/components/sections/feature-section";
import { FoundersInfrastructure } from "@/components/founders/founders-infrastructure";
import { RecruitmentVisual, NegotiationVisual, AnalyticsVisual } from "@/components/founders/founders-visuals";

// Browser Window Preview revealed inside the white circle
function FounderBrowserPreview({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.4, 0.6], [0, 1]);
  const scale = useTransform(progress, [0.4, 0.7], [0.8, 0.9]);
  const y = useTransform(progress, [0.4, 0.7], [40, 0]);

  return (
    <motion.div
      style={{ opacity, scale, y }}
      className="absolute inset-0 flex flex-col items-center justify-center z-30 pt-20 px-6 pointer-events-none"
    >
      <div className="w-full max-w-6xl group">
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
              alt="Founder Dashboard"
              fill
              className="object-cover object-left-top scale-100"
              priority
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ForFounders() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [navbarForceTransparent, setNavbarForceTransparent] = useState(true);
  const [navbarHideDashboard, setNavbarHideDashboard] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const heroContentScale = useTransform(scrollYProgress, [0, 0.45], [1, 0.95]);
  const heroPointerEvents = useTransform(scrollYProgress, [0, 0.45], ["auto", "none"]) as MotionValue<string>;

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
    <main className="relative bg-white selection:bg-emerald-500/10">
      <Navbar
        isTransparent
        forceTransparent={navbarForceTransparent}
        isDashboardHidden={navbarHideDashboard}
        theme="founders"
      />

      {/* Hero with Reveal Animation */}
      <div ref={containerRef} className="relative h-[250vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0B1710]">
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

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity, scale: heroContentScale, pointerEvents: heroPointerEvents }}
            className="flex flex-col items-center mx-auto max-w-4xl px-6 relative z-40 pt-32 md:pt-48"
          >
            <div className="flex flex-col items-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 tracking-wide uppercase">
                  For Founders
                </Badge>
              </motion.div>

              <motion.h1
                className="text-[44px] md:text-[62px] tracking-tighter leading-[1.05] text-white text-balance text-center"
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
                {"You built it.".split(" ").map((word, i) => (
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
                {"We'll help sell it.".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-[0.2em] last:mr-0 text-[#BFF2A0]"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="max-w-xl text-base md:text-lg text-white/70 leading-relaxed mx-auto text-center"
              >
                List your product. Set commissions. Let marketers sell it for you. Pay only when they bring revenue.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#BFF2A0] hover:bg-[#BFF2A0]/90 text-[#0B1710] font-bold border-none transition-all flex items-center" asChild>
                  <Link href="/signup?role=founder">
                    List Your Product
                    <div className="ml-2 h-7 w-7 rounded-full bg-[#0B1710]/10 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-[#0B1710]" />
                    </div>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base text-white border-white/10 hover:bg-white/5 font-bold transition-all" asChild>
                  <Link href="/login">See Demo</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.4 }}
                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12px] text-white/40 pt-6 font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#BFF2A0]/60" />
                  <span>No upfront cost</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#BFF2A0]/60" />
                  <span>Custom reward rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#BFF2A0]/60" />
                  <span>Connect Stripe in 5 min</span>
                </div>
              </motion.div>
            </div>

            <div className="mt-16 w-full flex justify-center pb-12">
              <FoundersHeroCards />
            </div>
          </motion.div>

          {/* CIRCULAR REVEAL OVERLAY */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <motion.div
              style={{ scale: useTransform(scrollYProgress, [0, 0.45, 0.9], [0, 1.2, 10]) }}
              className="w-[100vw] h-[100vw] rounded-full bg-white will-change-transform"
            />
          </div>

          {/* CONTENT INSIDE THE REVEAL */}
          <FounderBrowserPreview progress={scrollYProgress} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-40 bg-white">
        <FoundersBentoGrid />

        <FeatureSection
          badge="Marketplace"
          title="Marketers apply to you."
          description="Post your product. Marketers find you, apply, and start selling. No cold emails. No hunting for affiliates."
          items={["Verified partner pool", "Direct-to-founder applications", "Public or private listings"]}
          visual={(progress) => <RecruitmentVisual progress={progress} />}
        />

        <FeatureSection
          reversed
          badge="Automation"
          title="Don't pay for refunds."
          description="Set refund windows. We hold commissions until it's safe. Only pay for revenue that sticks."
          items={["Dynamic commission tiers", "Milestone bonuses", "Refund & reversal protection"]}
          visual={(progress) => <NegotiationVisual progress={progress} />}
        />

        <FeatureSection
          badge="Intelligence"
          title="See who's actually selling."
          description="Track every partner. See LTV, churn, which ones convert. One dashboard."
          items={["Partner scorecards", "LTV & Churn tracking", "Immutable audit trail"]}
          visual={(progress) => <AnalyticsVisual progress={progress} />}
        />

        <FoundersInfrastructure />

        <section className="relative z-10 py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready to get more  <br />
              <span className="text-[#128045]">customers?</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#BFF2A0] hover:bg-[#BFF2A0]/90 text-[#0B1710] font-bold transition-all border-none shadow-none" asChild>
                <Link href="/signup?role=founder">List Your Product Free</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer theme="founders" />
      </div>
    </main>
  );
}
