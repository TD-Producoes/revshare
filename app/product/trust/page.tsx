"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { ArrowUpRight, ShieldCheck, Wallet, Lock, History, Search, FileCheck, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { FeatureSection } from "@/components/sections/feature-section";

export default function TrustPaymentsPage() {
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
    <main className="relative bg-white selection:bg-[#0EA5E9]/20">
      <Navbar isTransparent forceTransparent={isTransparent} theme="trust" />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Sky Blue */}
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
          </motion.div>

          <div className="mx-auto max-w-4xl px-6 relative z-10 text-center">
            <div className="flex flex-col items-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 tracking-wide uppercase">
                  Security & Reliability
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
                {"Trust is our binary".split(" ").map((word, i) => (
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
                <span className="text-[#0EA5E9]">
                  {"foundation.".split(" ").map((word, i) => (
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
                From Stripe Connect integration to immutable audit logs, we've built the world's most transparent revenue-sharing infrastructure.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(14,165,233,0.2)]" asChild>
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
            badge="Infrastructure"
            title="Stripe Connect Integration."
            description="We leverage Stripe Connect to handle all financial movements. Funds never sit in a RevShare bank account—they flow directly from the project's Stripe account to the marketer's wallet."
            items={["Direct peer-to-peer flow", "Automated 1099 reporting", "Global payout coverage"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#0EA5E9]/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-[#0EA5E9]/10">
                <motion.div
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-8 flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-blue-50 rounded-lg flex items-center justify-center px-2">
                      <span className="text-[10px] font-bold text-[#0EA5E9]">STRIPE</span>
                    </div>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 space-y-4 pt-4">
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-3/4 bg-gray-50 rounded" />
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100" />
                      <div className="flex-1 h-6 bg-blue-50/50 rounded-lg" />
                    </div>
                  </div>
                  <div className="h-10 w-full bg-[#0F172A] rounded-xl flex items-center justify-center">
                    <Lock className="h-4 w-4 text-[#0EA5E9]" />
                  </div>
                </motion.div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Logic"
            title="Automated Refund Windows."
            description="Protect your cash flow with custom refund windows. Commissions are held in 'Pending' status until the risk period passes, ensuring you only pay for revenue you actually keep."
            items={["Configurable lock-ups", "Pending vs Available views", "Automated release triggers"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-blue-500/5 rounded-full flex items-center justify-center p-8">
                <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-black/5 space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400 uppercase">Settlement Progress</span>
                      <span className="text-[#0EA5E9]">64%</span>
                    </div>
                    <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#0EA5E9]"
                        initial={{ width: "30%" }}
                        animate={{ width: "64%" }}
                        transition={{ duration: 1.5 }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-black/5">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Pending</p>
                      <p className="text-sm font-bold text-gray-600">$1,240</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <p className="text-[8px] font-bold text-[#0EA5E9] uppercase">Ready</p>
                      <p className="text-sm font-bold text-[#0EA5E9]">$2,890</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />

          <FeatureSection
            badge="Transparency"
            title="Immutable Audit Logs."
            description="Every cent is accounted for. Both founders and marketers have access to a shared source of truth, with real-time logs for every tracking event, refund, and payment release."
            items={["Real-time event feed", "Shared verification view", "Dispute reduction architecture"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#0EA5E9]/5 rounded-full flex items-center justify-center p-12">
                <motion.div
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[#0EA5E9]" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Live Audit Feed</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: "Commission Release", time: "2m ago", status: "success" },
                      { label: "New Conversion", time: "15m ago", status: "pending" },
                      { label: "Refund Adjustment", time: "1h ago", status: "refunded" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-black/5">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-gray-700">{item.label}</p>
                          <p className="text-[7px] text-gray-400">{item.time}</p>
                        </div>
                        <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Final CTA */}
      <section className="relative z-10 py-32 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <Badge variant="outline" className="mb-8 rounded-full border-black/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-black/40">
            Secure Infrastructure
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
            Built on <span className="text-[#0EA5E9] italic">finance-grade</span> trust.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-14 rounded-full px-10 text-base bg-[#0F172A] text-white hover:bg-black font-bold transition-all shadow-xl">
              Create Secure Account
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-base font-bold bg-white hover:bg-gray-50 transition-all border-black/5">
              Review Documentation
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/10 py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-[#0F172A] rounded flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-[#0EA5E9] fill-[#0EA5E9]" />
            </div>
            <span className="font-bold text-lg tracking-tight">RevShare</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-bold">
            © 2026 RevShare Marketplace
          </p>
          <div className="flex gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[#0EA5E9] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#0EA5E9] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
