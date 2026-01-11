"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { ArrowUpRight, Sparkles, Trophy, Star, Target, Gift, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ForceLightMode } from "@/components/force-light-mode";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureSection } from "@/components/sections/feature-section";
import { isWaitlistMode } from "@/lib/utils";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

export default function PerformanceRewardsPage() {
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
      <main className="relative bg-white selection:bg-[#F97316]/20">
        <Navbar isTransparent forceTransparent={isTransparent} theme="rewards" />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Orange */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#431407] z-0"
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
          </motion.div>

          <div className="mx-auto max-w-4xl px-6 relative z-10 text-center">
            <div className="flex flex-col items-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 tracking-wide uppercase">
                  Rewards That Actually Motivate
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
                {"Rewards that keep".split(" ").map((word, i) => (
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
                <span className="text-[#F97316]">
                  {"partners shipping.".split(" ").map((word, i) => (
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
                Go beyond flat commissions. Set rewards for customer count, sales count, or total revenue, then pay out coupons, free months, plan upgrades, or perks.
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
                    className="h-12 rounded-full px-8 text-base bg-[#F97316] hover:bg-[#EA580C] text-white font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                    onClick={() => setIsWaitlistModalOpen(true)}
                  >
                    Claim Early Access
                    <div className="ml-2 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <ArrowUpRight className="h-4 w-4 text-white" />
                    </div>
                  </Button>
                ) : (
                  <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#F97316] hover:bg-[#EA580C] text-white font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(249,115,22,0.2)]" asChild>
                    <Link href="/signup">
                      Set up Rewards
                      <div className="ml-2 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                        <ArrowUpRight className="h-4 w-4 text-white" />
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
            badge="Gamification"
            title="Milestones tied to real outcomes."
            description="Create rewards based on number of customers, number of sales, or total revenue. Partners see progress live and rewards unlock automatically."
            items={["Customer-count rewards", "Sales-count rewards", "Total revenue tiers"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#F97316]/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-[#F97316]/10">
                <motion.div
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-8 flex flex-col gap-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-800">Elite Tier Unlock</p>
                      <p className="text-[8px] text-gray-400">Target: $10k Monthly Rev</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-gray-400">PROGRESS TO BONUS</span>
                        <span className="text-[#F97316]">85%</span>
                      </div>
                      <div className="h-2 w-full bg-orange-50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#F97316]"
                          initial={{ width: "20%" }}
                          animate={{ width: "85%" }}
                          transition={{ duration: 2 }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-black/5 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-600">NEXT REWARD</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 text-[8px] border-emerald-500/20">$500.00</Badge>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Loyalty"
            title="Rewards people actually want."
            description="Offer a discount coupon, a free subscription period, a plan upgrade, or perks. Choose what fits your product and margins."
            items={["Discount coupons", "Free periods", "Plan upgrades or perks"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-orange-500/5 rounded-full flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                  {[
                    { icon: Gift, label: "Perks" },
                    { icon: Star, label: "Badge" },
                    { icon: Target, label: "VIP" },
                    { icon: Sparkles, label: "Access" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-2xl shadow-xl border border-black/5 p-4 flex flex-col items-center justify-center gap-2"
                    >
                      <item.icon className={`h-6 w-6 ${i % 2 === 0 ? 'text-[#F97316]' : 'text-emerald-500'}`} />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <section className="relative z-10 py-24 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Reward the partners <br />
            who <span className="text-[#F97316] italic">move the needle.</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {waitlistMode ? (
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base bg-[#F97316] hover:bg-[#EA580C] text-white font-bold transition-all border-none shadow-none"
                onClick={() => setIsWaitlistModalOpen(true)}
              >
                Claim Early Access
              </Button>
            ) : (
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#F97316] hover:bg-[#EA580C] text-white font-bold transition-all border-none shadow-none" asChild>
                <Link href="/signup">Launch your rewards</Link>
              </Button>
            )}
          </div>
          <p className="mt-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Milestones and partner perks
          </p>
        </div>
      </section>

      <Footer className="bg-white" />
      {waitlistMode && (
        <WaitlistModal
          isOpen={isWaitlistModalOpen}
          onOpenChange={setIsWaitlistModalOpen}
          source="product-rewards"
        />
      )}
      </main>
    </>
  );
}
