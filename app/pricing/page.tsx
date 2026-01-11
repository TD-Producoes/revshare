"use client";

import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useRef } from "react";
import { CheckCircle2, ArrowUpRight, Shield, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ForceLightMode } from "@/components/force-light-mode";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { isWaitlistMode } from "@/lib/utils";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

export default function PricingPage() {
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
      <main className="relative bg-white selection:bg-amber-500/10">
        <Navbar isTransparent forceTransparent={isTransparent} />

      <div ref={containerRef}>
        {/* Hero Section */}
        <section className="relative pt-32 pb-22 flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Expanding Background Circle - Amber Palette */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1f3d2d] z-0"
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
                  Simple Pricing
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
                {"Simple, commission-only".split(" ").map((word, i) => (
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
                  {"pricing.".split(" ").map((word, i) => (
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
                RevShare is free to join. We only take a small percentage of commissions generated through the platform.
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
                    className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold border-none transition-all flex items-center group"
                    onClick={() => setIsWaitlistModalOpen(true)}
                  >
                    Claim Early Access
                    <div className="ml-2 h-7 w-7 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center group-hover:bg-[#3D2B1F]/20">
                      <ArrowUpRight className="h-4 w-4 text-[#3D2B1F]" />
                    </div>
                  </Button>
                ) : (
                  <Button size="lg" className="h-12 rounded-full px-8 text-base bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-bold border-none transition-all flex items-center group" asChild>
                    <Link href="/signup">
                      Get started free
                      <div className="ml-2 h-7 w-7 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center group-hover:bg-[#3D2B1F]/20">
                        <ArrowUpRight className="h-4 w-4 text-[#3D2B1F]" />
                      </div>
                    </Link>
                  </Button>
                )}
              </motion.div>

              {/* Trust Bullets */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.4 }}
                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12px] text-white/40 pt-6 font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB347]/60" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB347]/60" />
                  <span>No monthly plans</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB347]/60" />
                  <span>No hidden charges</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      {/* Core Principle Quote */}
      <section className="py-12 bg-amber-50/30">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center space-y-4"
          >
            <blockquote className="text-xl md:text-2xl font-semibold text-black leading-relaxed">
              RevShare only makes money when you do.
              <br />
              <span className="text-amber-600">No subscriptions. No upfront fees.</span>
            </blockquote>
            <p className="text-sm text-black/60 max-w-2xl mx-auto leading-relaxed">
              Currently free for founders while we&apos;re starting. We&apos;re exploring subscription-based pricing as an alternative to platform fees — coming soon.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Marketer Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-10 flex flex-col"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-black">For Marketers</h3>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl md:text-5xl font-bold text-black mb-2">$0</div>
                  <p className="text-sm text-black/60 font-medium">— always</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <h4 className="text-sm font-bold text-black/80 uppercase tracking-wider mb-4">What you get</h4>
                <ul className="space-y-3">
                  {[
                    "Access to public project directory",
                    "Apply to unlimited programs",
                    "Track earnings, revenue, and performance",
                    "Transparent payout history",
                    "Performance rewards & milestones",
                    "Stripe-powered payouts",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-black/70 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-black/5">
                {waitlistMode ? (
                  <Button
                    className="w-full h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold border-none"
                    onClick={() => setIsWaitlistModalOpen(true)}
                  >
                    Claim Early Access
                  </Button>
                ) : (
                  <Button className="w-full h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold border-none" asChild>
                    <Link href="/signup?role=marketer">Create a marketer profile</Link>
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Founder Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-10 flex flex-col"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-black">For Founders</h3>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl md:text-5xl font-bold text-black mb-2">5%</div>
                  <p className="text-sm text-black/60 font-medium">of marketer commissions</p>
                </div>
                
                <div className="bg-white/80 rounded-xl p-4 mb-4">
                  <p className="text-xs text-black/60 leading-relaxed">
                    <strong className="text-black">Not revenue.</strong> Not sales.
                    <br />
                    Only commissions actually earned by marketers.
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-900 mb-1">Example</p>
                  <p className="text-sm text-black/80">
                    If a marketer earns $100 in commission, RevShare earns $5.
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <h4 className="text-sm font-bold text-black/80 uppercase tracking-wider mb-4">What&apos;s included</h4>
                <ul className="space-y-3">
                  {[
                    "Unlimited projects",
                    "Unlimited marketers",
                    "Public project discovery",
                    "Commission tracking & refund handling",
                    "Payout automation & audit logs",
                    "Performance rewards & milestones",
                    "Stripe Connect payments",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-black/70 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-black/5">
                {waitlistMode ? (
                  <Button
                    className="w-full h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold border-none"
                    onClick={() => setIsWaitlistModalOpen(true)}
                  >
                    Claim Early Access
                  </Button>
                ) : (
                  <Button className="w-full h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold border-none" asChild>
                    <Link href="/signup?role=founder">Launch your first project</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How the Fee Works */}
      <section className="py-24 bg-white border-y border-gray-50">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
                How the platform fee works
              </h2>
              <p className="text-lg text-black/60 max-w-2xl mx-auto leading-relaxed">
                RevShare takes <strong className="text-black">5% of marketer commissions</strong>, only after revenue is generated and refund windows close.
              </p>
            </div>

            {/* Visual Example */}
            <div className="bg-[#F9F8F6] rounded-[2rem] p-8 md:p-10 border border-black/5">
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <span className="text-sm text-black/60">Customer pays:</span>
                  <span className="text-lg font-bold text-black">$100</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <span className="text-sm text-black/60">Marketer commission (20%):</span>
                  <span className="text-lg font-bold text-emerald-600">$20</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <span className="text-sm text-black/60">RevShare platform fee (5% of commission):</span>
                  <span className="text-lg font-bold text-blue-600">$1</span>
                </div>
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-black">Marketer receives:</span>
                    <span className="text-lg font-bold text-emerald-600">$20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-black/60 text-xs">(Full commission, no fees)</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/10">
                    <span className="text-sm font-semibold text-black">Founder receives:</span>
                    <span className="text-lg font-bold text-emerald-800">$79</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-black/60 text-xs">($80 - $1 platform fee)</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-black/50 italic max-w-xl mx-auto">
              RevShare never takes a percentage of your revenue — only of commissions paid to marketers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why This Pricing Model */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
              Why commission-only pricing?
            </h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto leading-relaxed mb-8">
              RevShare is designed to align incentives between founders, marketers, and the platform.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Founders only pay when they make money",
                  description: "No upfront costs or monthly fees. You only pay when revenue is generated.",
                },
                {
                  title: "Marketers never pay to participate",
                  description: "Free access to all projects. No barriers to entry for talented marketers.",
                },
                {
                  title: "The platform only succeeds when partnerships succeed",
                  description: "Our success is directly tied to your success. We win when you win.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#F9F8F6] rounded-[1.5rem] p-6">
                  <h3 className="text-base font-bold text-black mb-2">{item.title}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-black/50 italic pt-4">
              No retainers. No subscriptions. No sunk costs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stripe & Payments Reassurance */}
      <section className="py-24 bg-gray-50/30 border-y border-gray-100">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-amber-600" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black">
                Secure, compliant payments
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                {
                  icon: <CreditCard className="h-5 w-5 text-amber-600" />,
                  title: "Payments powered by Stripe Connect",
                  description: "Industry-leading payment infrastructure trusted by millions of businesses.",
                },
                {
                  icon: <Shield className="h-5 w-5 text-amber-600" />,
                  title: "Funds move between verified parties",
                  description: "All parties are verified through Stripe Connect for maximum security.",
                },
                {
                  icon: <CheckCircle2 className="h-5 w-5 text-amber-600" />,
                  title: "Full payout history and audit logs",
                  description: "Every transaction is recorded in an immutable audit trail.",
                },
                {
                  icon: <Shield className="h-5 w-5 text-amber-600" />,
                  title: "Refund-aware accounting",
                  description: "Automatic handling of refunds and chargebacks with proper accounting.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-6 flex items-start gap-4">
                  <div className="shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="text-base font-bold text-black mb-1">{item.title}</h3>
                    <p className="text-sm text-black/60 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-black/50 italic pt-4">
              RevShare does not sell or monetize your data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black">
                  Frequently Asked Questions
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "Is RevShare really free for marketers?",
                  answer: "Yes. Marketers never pay fees or platform charges.",
                },
                {
                  question: "Do founders pay anything upfront?",
                  answer: "No. There are no setup or monthly fees.",
                },
                {
                  question: "When is the platform fee charged?",
                  answer: "Only when commissions become payable (after refund windows).",
                },
                {
                  question: "Is the 5% fee negotiable?",
                  answer: "Not today. Keeping pricing simple ensures fairness across the marketplace.",
                },
                {
                  question: "Are Stripe fees included?",
                  answer: "Stripe processing fees may apply depending on the payout method, and are shown transparently.",
                },
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-[#F9F8F6] rounded-[1.5rem] p-6 md:p-8"
                >
                  <h3 className="text-lg font-bold text-black mb-3 flex items-start gap-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm md:text-base text-black/70 leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
              Start earning together — without upfront risk.
            </h2>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold border-none transition-all" asChild>
                <Link href="/projects">
                  Explore projects
                </Link>
              </Button>
              {waitlistMode ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full px-8 text-base border-2 border-black/10 hover:bg-amber-50 font-bold transition-all"
                  onClick={() => setIsWaitlistModalOpen(true)}
                >
                  Claim Early Access
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base border-2 border-black/10 hover:bg-amber-50 font-bold transition-all" asChild>
                  <Link href="/signup?role=founder">
                    Create a project
                  </Link>
                </Button>
              )}
            </div>

            <p className="text-sm text-black/50 font-medium uppercase tracking-widest pt-4">
              No credit card required to get started.
            </p>
          </motion.div>
        </div>
      </section>
      </div>

      <Footer />
      {waitlistMode && (
        <WaitlistModal
          isOpen={isWaitlistModalOpen}
          onOpenChange={setIsWaitlistModalOpen}
          source="pricing"
        />
      )}
      </main>
    </>
  );
}
