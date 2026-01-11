"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { ArrowUpRight, Globe, Users, BarChart3, Search, LayoutGrid, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureSection } from "@/components/sections/feature-section";
import { isWaitlistMode } from "@/lib/utils";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

export default function MarketplacePage() {
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
    <main className="relative bg-white selection:bg-[#8B5CF6]/20">
      <Navbar isTransparent forceTransparent={isTransparent} theme="marketplace" />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Violet */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1E1B4B] z-0"
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
                  Category Creation
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
                {"The open economy of".split(" ").map((word, i) => (
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
                <span className="text-[#8B5CF6]">
                  {"partnerships.".split(" ").map((word, i) => (
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
                RevShare isn't just a tool; it's a global marketplace. We connect high-growth SaaS founders with verified performance marketers in a transparent, public ecosystem.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(139,92,246,0.2)]" asChild>
                  <Link href="/projects">
                    Enter Marketplace
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
            badge="Discovery"
            title="Public Project Directory."
            description="Founders can list their projects and revenue share programs publicly. Marketers can browse, filter by vertical, and apply to programs with a single click."
            items={["Vertical-based filtering", "Verified revenue stats", "Direct application flow"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#8B5CF6]/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-[#8B5CF6]/10">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-lg border border-black/5 p-4 space-y-2">
                      <div className="h-6 w-6 rounded bg-violet-100" />
                      <div className="h-1.5 w-12 bg-gray-100 rounded" />
                      <div className="h-1 w-8 bg-violet-50 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Reputation"
            title="Verified Marketer Directory."
            description="Founders can find the perfect partners by browsing our directory of verified performance marketers. See their historical performance, specialty verticals, and audience stats."
            items={["Performance leaderboards", "Verified track records", "Direct partner recruitment"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#8B5CF6]/5 rounded-full flex items-center justify-center p-8">
                <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-black/5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">Top Recruiters</p>
                      <p className="text-[10px] text-gray-400">Weekly Leaderboard</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-50" />
                          <div className="h-1.5 w-20 bg-gray-100 rounded" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500">+{20 - i}% ROI</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <section className="relative z-10 py-24 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            The world's first <br />
            <span className="text-[#8B5CF6] italic">revenue-share</span> network.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {waitlistMode ? (
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all border-none shadow-none"
                onClick={() => setIsWaitlistModalOpen(true)}
              >
                Claim Early Access
              </Button>
            ) : (
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all border-none shadow-none" asChild>
                <Link href="/signup">Join Marketplace Now</Link>
              </Button>
            )}
          </div>
          <p className="mt-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            The Open Ecosystem for Growth
          </p>
        </div>
      </section>

      <Footer className="bg-white" />
      {waitlistMode && (
        <WaitlistModal
          isOpen={isWaitlistModalOpen}
          onOpenChange={setIsWaitlistModalOpen}
          source="product-marketplace"
        />
      )}
    </main>
  );
}
