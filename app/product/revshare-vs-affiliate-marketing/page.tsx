"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { ArrowUpRight, Zap, CheckCircle2, RefreshCw, Layers, ShieldCheck, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ForceLightMode } from "@/components/force-light-mode";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureSection } from "@/components/sections/feature-section";
import { ComparisonTable } from "@/components/sections/comparison-table";
import { PainPointsSection } from "@/components/sections/pain-points-section";
import { isWaitlistMode } from "@/lib/utils";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

export default function RevShareVsAffiliateMarketing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransparent, setIsTransparent] = React.useState(true);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = React.useState(false);
  const waitlistMode = isWaitlistMode();

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
    <>
      <ForceLightMode />
      <main className="relative bg-white selection:bg-[#FFB347]/20">
        <Navbar isTransparent forceTransparent={isTransparent} />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Amber */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#3D2B1F] z-0"
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
                  A Quick Comparison
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
                {"RevShare vs.".split(" ").map((word, i) => (
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
                <span className="text-[#FFB347]">
                  {"affiliate bounties.".split(" ").map((word, i) => (
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
                One-time bounties stop at signup. RevShare shares recurring revenue, so incentives stay aligned as your SaaS grows.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                {waitlistMode ? (
                  <Button
                    size="lg"
                    className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(255,179,71,0.2)]"
                    onClick={() => setIsWaitlistModalOpen(true)}
                  >
                    Claim Early Access
                    <div className="ml-2 h-7 w-7 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center group-hover:bg-[#3D2B1F]/20">
                      <ArrowUpRight className="h-4 w-4 text-[#3D2B1F]" />
                    </div>
                  </Button>
                ) : (
                  <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(255,179,71,0.2)]" asChild>
                    <Link href="/signup">
                      Start Earning
                      <div className="ml-2 h-7 w-7 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center group-hover:bg-[#3D2B1F]/20">
                        <ArrowUpRight className="h-4 w-4 text-[#3D2B1F]" />
                      </div>
                    </Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Content */}
        <div className="py-24 space-y-24">
          <FeatureSection
            badge="Alignment"
            title="Recurring beats one-time."
            description="Affiliate bounties end after signup. RevShare keeps partners paid on net revenue as long as the customer stays."
            items={["Aligned incentives", "Ongoing payouts", "Compounding upside"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#FFB347]/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-[#FFB347]/10">
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="relative w-32 h-32 flex items-center justify-center"
                  >
                    <RefreshCw className="h-24 w-24 text-[#FFB347] opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-[#FFB347]" />
                    </div>
                  </motion.div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-[#FFB347] uppercase tracking-widest">Compounding Growth</p>
                  </div>
                </div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Integrity"
            title="Pay on net revenue."
            description="Don't pay for refunds. RevShare waits out the refund window and calculates commissions on net revenue, so founders stay profitable and partners get paid for real value."
            items={["Refund-aware payouts", "Net revenue alignment", "Automatic adjustments"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#FFB347]/5 rounded-full flex items-center justify-center p-8">
                <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-black/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                    <span>GROSS REVENUE</span>
                    <span className="line-through">$1,000.00</span>
                  </div>
                  <div className="h-1 w-full bg-red-50 rounded-full overflow-hidden">
                    <div className="h-full w-[20%] bg-red-400" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-emerald-600">
                    <span>NET REVENUE</span>
                    <span>$800.00</span>
                  </div>
                  <div className="h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
                    <div className="h-full w-[80%] bg-emerald-500" />
                  </div>
                  <div className="pt-2 border-t border-black/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Your Share (30%)</span>
                    <span className="text-lg font-bold text-[#FFB347]">$240.00</span>
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        <PainPointsSection />
        <ComparisonTable />
      </div>

      <section className="relative z-10 py-24 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Stop chasing bounties. <br />
            Start <span className="text-[#FFB347] italic">sharing recurring revenue.</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {waitlistMode ? (
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold transition-all border-none shadow-none"
                onClick={() => setIsWaitlistModalOpen(true)}
              >
                Claim Early Access
              </Button>
            ) : (
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold transition-all border-none shadow-none" asChild>
                <Link href="/signup">Launch your program</Link>
              </Button>
            )}
          </div>
          <p className="mt-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            A better model for SaaS
          </p>
        </div>
      </section>

      <Footer className="bg-white" theme="affiliate-marketing" />
      {waitlistMode && (
        <WaitlistModal
          isOpen={isWaitlistModalOpen}
          onOpenChange={setIsWaitlistModalOpen}
          source="product-revshare-vs-marketing"
        />
      )}
      </main>
    </>
  );
}
