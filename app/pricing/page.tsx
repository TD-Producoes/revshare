"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight, Shield, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function PricingPage() {
  return (
    <main className="relative bg-white selection:bg-amber-500/10">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Badge variant="outline" className="rounded-full border-amber-500/10 bg-amber-50/50 px-3 py-1 text-[11px] font-bold text-amber-600 mb-4">
              Simple Pricing
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-tight">
              Simple, commission-only pricing.
            </h1>
            
            <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
              RevShare is free to join. We only take a small percentage of commissions generated through the platform.
            </p>

            {/* Trust Bullets */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-black/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>No monthly plans</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>No hidden charges</span>
              </div>
            </div>

            <div className="pt-6">
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold border-none transition-all" asChild>
                <Link href="/signup">
                  Get started free
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Principle Quote */}
      <section className="py-12 bg-amber-50/30 border-y border-amber-100/50">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <blockquote className="text-xl md:text-2xl font-semibold text-black leading-relaxed">
              RevShare only makes money when you do.
              <br />
              <span className="text-amber-600">No subscriptions. No upfront fees.</span>
            </blockquote>
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
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <span className="text-2xl">🧑‍💻</span>
                  </div>
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
                <p className="text-xs text-black/50 font-medium mb-4 italic">
                  Marketers are never charged platform fees.
                </p>
                <Button className="w-full h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold border-none" asChild>
                  <Link href="/signup?role=marketer">Create a marketer profile</Link>
                </Button>
              </div>
            </motion.div>

            {/* Creator Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-10 flex flex-col border-2 border-amber-500/20"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <span className="text-2xl">🏗️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-black">For Creators</h3>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl md:text-5xl font-bold text-black mb-2">5%</div>
                  <p className="text-sm text-black/60 font-medium">of marketer commissions</p>
                </div>
                
                <div className="bg-white/80 rounded-xl p-4 border border-amber-100 mb-4">
                  <p className="text-xs text-black/60 leading-relaxed">
                    <strong className="text-black">Not revenue.</strong> Not sales.
                    <br />
                    Only commissions actually earned by marketers.
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
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
                <Button className="w-full h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold border-none" asChild>
                  <Link href="/signup?role=creator">Launch your first project</Link>
                </Button>
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
                  <span className="text-lg font-bold text-amber-600">$20</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <span className="text-sm text-black/60">RevShare platform fee (5% of commission):</span>
                  <span className="text-lg font-bold text-blue-600">$1</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-black">Marketer receives:</span>
                  <span className="text-xl font-bold text-emerald-600">$19</span>
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
              RevShare is designed to align incentives between creators, marketers, and the platform.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Creators only pay when they make money",
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
                <div key={i} className="bg-[#F9F8F6] rounded-[1.5rem] p-6 border border-black/5">
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
                <div key={i} className="bg-white rounded-xl p-6 border border-black/5 flex items-start gap-4">
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
                <HelpCircle className="h-6 w-6 text-amber-600" />
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
                  question: "Do creators pay anything upfront?",
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
                  className="bg-[#F9F8F6] rounded-[1.5rem] p-6 md:p-8 border border-black/5"
                >
                  <h3 className="text-lg font-bold text-black mb-3 flex items-start gap-2">
                    <span className="text-amber-600">❓</span>
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
      <section className="py-24 bg-white border-t border-gray-50">
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
              <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base border-2 border-black/10 hover:bg-amber-50 font-bold transition-all" asChild>
                <Link href="/signup?role=creator">
                  Create a project
                </Link>
              </Button>
            </div>

            <p className="text-sm text-black/50 font-medium uppercase tracking-widest pt-4">
              No credit card required to get started.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

