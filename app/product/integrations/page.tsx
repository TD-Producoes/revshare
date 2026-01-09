"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { ArrowUpRight, Cpu, Layers, Link2, Code2, Globe, Database, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { FeatureSection } from "@/components/sections/feature-section";

export default function IntegrationsPage() {
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
    <main className="relative bg-white selection:bg-[#14B8A6]/20">
      <Navbar isTransparent forceTransparent={isTransparent} theme="integrations" />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Teal */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#042F2E] z-0"
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
                  Native Ecosystem
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
                {"Built for your existing".split(" ").map((word, i) => (
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
                <span className="text-[#14B8A6]">
                  {"stack.".split(" ").map((word, i) => (
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
                Connect RevShare to your product in seconds. Whether you're on Stripe, Shopify, or a custom SaaS stack, our native integrations make revenue sharing seamless.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold border-none transition-all flex items-center group shadow-[0_0_20px_rgba(20,184,166,0.2)]" asChild>
                  <Link href="/signup">
                    Explore Docs
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
            badge="Foundation"
            title="Stripe & Shopify Native."
            description="Our deep integration with the world's leading commerce platforms means you can launch your program with zero coding required. We sync revenue data and refunds automatically."
            items={["Automatic MRR syncing", "Deep Shopify app support", "One-click Stripe connect"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-[#14B8A6]/5 rounded-full flex items-center justify-center p-12 overflow-hidden border border-[#14B8A6]/10">
                <motion.div
                  className="w-full h-full bg-white rounded-3xl shadow-2xl border border-black/5 p-8 flex flex-col items-center justify-center gap-6"
                >
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Link2 className="h-6 w-6" />
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Globe className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-3/4 bg-gray-100 rounded mx-auto" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-10 w-32 bg-[#042F2E] rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest"
                  >
                    Connected
                  </motion.div>
                </motion.div>
              </div>
            )}
          />

          <FeatureSection
            reversed
            badge="Engineering"
            title="APIs & Webhooks for Custom Stacks."
            description="Building something unique? Our robust API and real-time webhooks allow you to integrate revenue sharing into any custom SaaS or mobile application architecture."
            items={["Full REST API access", "Real-time webhook events", "Developer-first documentation"]}
            visual={(progress) => (
              <div className="relative w-full max-w-sm aspect-square bg-teal-500/5 rounded-full flex items-center justify-center p-8">
                <div className="w-full h-full bg-[#0F172A] rounded-2xl shadow-2xl p-6 font-mono text-xs border border-white/10">
                  <div className="flex gap-1.5 mb-4">
                    <div className="h-2 w-2 rounded-full bg-red-400/50" />
                    <div className="h-2 w-2 rounded-full bg-amber-400/50" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400/50" />
                  </div>
                  <p className="text-emerald-400">POST <span className="text-white">/v1/commissions</span></p>
                  <p className="text-emerald-400/40 mt-2">{"{"}</p>
                  <p className="text-emerald-400/40 ml-4">"amount": <span className="text-blue-400">29.00</span>,</p>
                  <p className="text-emerald-400/40 ml-4">"currency": <span className="text-amber-400">"usd"</span>,</p>
                  <p className="text-emerald-400/40 ml-4">"customer_id": <span className="text-amber-400">"cus_123"</span></p>
                  <p className="text-emerald-400/40">{"}"}</p>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-emerald-400">{"HTTP 200 OK"}</p>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Final CTA */}
      <section className="relative z-10 py-32 text-center bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <Badge variant="outline" className="mb-8 rounded-full border-black/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-black/40">
            Developer Ecosystem
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
            Seamlessly integrated <br />
            with <span className="text-[#14B8A6] italic">your technology.</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-14 rounded-full px-10 text-base bg-[#042F2E] text-white hover:bg-black font-bold transition-all shadow-xl">
              Browse API Docs
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-base font-bold bg-white hover:bg-gray-50 transition-all border-black/5">
              View App Store
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/10 py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-[#042F2E] rounded flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-[#14B8A6] fill-[#14B8A6]" />
            </div>
            <span className="font-bold text-lg tracking-tight">RevShare</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-bold">
            © 2026 RevShare Marketplace
          </p>
          <div className="flex gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[#14B8A6] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#14B8A6] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
