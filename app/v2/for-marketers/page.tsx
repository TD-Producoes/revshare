"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  Gift,
  LayoutGrid,
  LineChart,
  Search,
  Shield,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PALETTE = {
  dark: {
    bg: "#17312A",
    bgAlt: "#1D3A31",
    card: "#1F3F36",
    border: "#2B5348",
    text: "#F6F3EE",
    subtext: "#C9C2B4",
    accent: "#9BE58F",
    accentWarm: "#E9B46D",
  },
  light: {
    bg: "#F8F2EA",
    bgAlt: "#EFE6DA",
    card: "#FFFDF9",
    border: "#E3D9CB",
    text: "#1F261F",
    subtext: "#5E5A52",
    accent: "#E28E43",
    accentWarm: "#6FBE8B",
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

export default function ForMarketersV2Page() {
  const { scrollYProgress } = useScroll();
  const heroCardY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);
  const heroGlow = useTransform(scrollYProgress, [0, 0.3], [1, 0.6]);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = prev;
    };
  }, []);

  const dark = PALETTE.dark;
  const light = PALETTE.light;

  return (
    <main className="min-h-screen">
      <V2Navbar />

      {/* Hero */}
      <section
        className="relative min-h-screen overflow-hidden"
        style={{ backgroundColor: dark.bg, color: dark.text }}
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 10%, rgba(155,229,143,0.25), transparent 45%), radial-gradient(circle at 80% 20%, rgba(233,180,109,0.2), transparent 50%)",
            }}
          />
          <motion.div
            className="absolute -bottom-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(155,229,143,0.45) 0%, transparent 70%)",
              opacity: heroGlow,
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-16 px-6 pb-20 pt-28 lg:flex-row lg:items-center">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex-1"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ borderColor: dark.border, color: dark.accent }}
            >
              For Marketers
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-6 text-5xl font-semibold leading-[1.05] md:text-6xl lg:text-7xl"
            >
              Built for the next stage of{" "}
              <span style={{ color: dark.accent }}>revenue growth.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-relaxed"
              style={{ color: dark.subtext }}
            >
              RevShare is the public marketplace where marketers discover trusted programs,
              track real revenue, and get paid with total clarity.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base font-semibold shadow-xl transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: dark.accent, color: "#193128" }}
                asChild
              >
                <Link href="/projects">
                  Explore programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-full border px-8 text-base font-semibold transition-transform hover:scale-[1.02]"
                style={{ borderColor: dark.border, color: dark.accent }}
                asChild
              >
                <Link href="/signup">Create a marketer profile</Link>
              </Button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap gap-6 text-sm font-medium"
              style={{ color: dark.subtext }}
            >
              {[
                "No platform fees",
                "Real revenue only",
                "Transparent payouts",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: dark.accent }} />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative flex-1"
            style={{ y: heroCardY }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-32 w-32 rounded-full bg-orange-400/20 blur-3xl" />

            <div
              className="relative rounded-[32px] border p-6 shadow-[0_35px_120px_rgba(15,30,26,0.55)]"
              style={{ backgroundColor: dark.bgAlt, borderColor: dark.border }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Revenue Overview</div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "rgba(155,229,143,0.15)", color: dark.accent }}
                >
                  Live
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Revenue", value: "$2.8M", progress: 74 },
                  { label: "Gross Profit", value: "$1.2M", progress: 62 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border px-4 py-5"
                    style={{ borderColor: dark.border, backgroundColor: "#1B352C" }}
                  >
                    <div
                      className="h-14 w-14 rounded-full"
                      style={{
                        background: `conic-gradient(${dark.accent} 0 ${item.progress}%, ${dark.border} ${item.progress}% 100%)`,
                      }}
                    />
                    <div className="mt-4 text-sm" style={{ color: dark.subtext }}>
                      {item.label}
                    </div>
                    <div className="text-lg font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: dark.border }}>
                <div className="flex items-center justify-between text-xs" style={{ color: dark.subtext }}>
                  <span>Cash balance</span>
                  <span>$420K</span>
                </div>
                <div className="mt-3 h-20 rounded-xl bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section: Discover */}
      <SectionShell tone="light">
        {(theme) => (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
              <div
                className="rounded-[28px] border p-6 shadow-2xl"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutGrid className="h-4 w-4" style={{ color: theme.accent }} />
                    Programs
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                    style={{ borderColor: theme.border, color: theme.subtext }}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { name: "FlowMetrics", commission: "25%", revenue: "$42K/mo" },
                    { name: "BuildStack", commission: "20%", revenue: "$28K/mo" },
                    { name: "SignalLoop", commission: "30%", revenue: "$18K/mo" },
                  ].map((program, index) => (
                    <div
                      key={program.name}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: index === 0 ? "rgba(226,142,67,0.08)" : "transparent",
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold">{program.name}</div>
                        <div className="text-xs" style={{ color: theme.subtext }}>
                          SaaS
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-semibold" style={{ color: theme.accent }}>
                          {program.commission}
                        </div>
                        <div style={{ color: theme.subtext }}>{program.revenue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <IconTag icon={Search} label="Discovery" tone="light" />
              <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
                Discover programs without the back-and-forth.
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
                Browse public revenue-share programs, filter by category, and see what
                actually converts before you apply.
              </p>
              <ul className="space-y-3 text-sm" style={{ color: theme.subtext }}>
                {[
                  "Public project directory",
                  "Search by commission and revenue",
                  "Leaderboards for top programs",
                  "New listings every day",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: theme.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}
      </SectionShell>

      {/* Section: Apply once */}
      <SectionShell tone="dark">
        {(theme) => (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <IconTag icon={LayoutGrid} label="Simplicity" tone="dark" />
              <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
                Apply once.{" "}
                <span style={{ color: theme.accent }}>Everything stays organized.</span>
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
                Apply directly inside RevShare. Once approved, you get links, coupons,
                and performance tracking in one place.
              </p>
              <ul className="space-y-3 text-sm" style={{ color: theme.subtext }}>
                {[
                  "Simple application flow",
                  "All approved offers in one dashboard",
                  "No back-and-forth emails",
                  "Clear program terms upfront",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: theme.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="rounded-[28px] border p-6 shadow-2xl"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>My Offers</span>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "rgba(155,229,143,0.2)", color: theme.accent }}>
                    3 Active
                  </span>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { name: "FlowMetrics Pro", status: "Active", link: "flow.ref/abc123" },
                    { name: "BuildStack Teams", status: "Active", link: "build.ref/xyz789" },
                    { name: "SignalLoop", status: "Pending", link: "pending" },
                  ].map((offer) => (
                    <div
                      key={offer.name}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3"
                      style={{ borderColor: theme.border, backgroundColor: theme.bgAlt }}
                    >
                      <div>
                        <div className="text-sm font-semibold">{offer.name}</div>
                        <div className="text-xs font-mono" style={{ color: theme.subtext }}>
                          {offer.link}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor:
                            offer.status === "Active" ? "rgba(155,229,143,0.2)" : "rgba(233,180,109,0.2)",
                          color: offer.status === "Active" ? theme.accent : theme.accentWarm,
                        }}
                      >
                        {offer.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </SectionShell>

      {/* Section: Transparency */}
      <SectionShell tone="light">
        {(theme) => (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <IconTag icon={Eye} label="Transparency" tone="light" />
              <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
                See exactly what you earn, and why.
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
                Every sale, adjustment, and payout is visible. Nothing hidden. No silent
                deductions.
              </p>
              <ul className="space-y-3 text-sm" style={{ color: theme.subtext }}>
                {[
                  "Earnings broken down by project",
                  "Pending vs available commissions",
                  "Refund-window aware tracking",
                  "Full audit trail for every change",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: theme.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="rounded-[28px] border p-6 shadow-2xl"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Total earned", value: "$4,280", accent: theme.accent },
                    { label: "Pending", value: "$840", accent: theme.accentWarm },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border px-4 py-4"
                      style={{ borderColor: theme.border, backgroundColor: theme.bgAlt }}
                    >
                      <div className="text-xs uppercase tracking-wide" style={{ color: theme.subtext }}>
                        {metric.label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold" style={{ color: metric.accent }}>
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { label: "FlowMetrics", amount: "+$48.00", time: "2h ago" },
                    { label: "Payout", amount: "$420.00", time: "3d ago" },
                    { label: "Refund", amount: "-$24.00", time: "5d ago" },
                  ].map((activity) => (
                    <div
                      key={activity.label}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: theme.border, backgroundColor: theme.bgAlt }}
                    >
                      <div>
                        <div className="font-semibold">{activity.label}</div>
                        <div className="text-xs" style={{ color: theme.subtext }}>
                          {activity.time}
                        </div>
                      </div>
                      <div className="font-semibold">{activity.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </SectionShell>

      {/* Section: Payouts */}
      <SectionShell tone="dark">
        {(theme) => (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="rounded-[28px] border p-6 shadow-2xl"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wallet className="h-4 w-4" style={{ color: theme.accent }} />
                  Payout schedule
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { date: "Jan 15", amount: "$420.00", status: "Paid" },
                    { date: "Feb 15", amount: "$580.00", status: "Paid" },
                    { date: "Mar 15", amount: "$840.00", status: "Processing" },
                  ].map((payout) => (
                    <div
                      key={payout.date}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: theme.border, backgroundColor: theme.bgAlt }}
                    >
                      <div>
                        <div className="font-semibold">{payout.date}</div>
                        <div className="text-xs" style={{ color: theme.subtext }}>
                          {payout.status}
                        </div>
                      </div>
                      <div className="font-semibold">{payout.amount}</div>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-6 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs"
                  style={{ borderColor: theme.border, color: theme.subtext }}
                >
                  <Shield className="h-4 w-4" style={{ color: theme.accent }} />
                  Stripe Connect payouts
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <IconTag icon={Wallet} label="Reliability" tone="dark" />
              <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
                Predictable payouts, every time.
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
                Commissions unlock only after the refund window ends. When available, payouts
                move on a clear schedule.
              </p>
              <ul className="space-y-3 text-sm" style={{ color: theme.subtext }}>
                {[
                  "Clear payout timelines",
                  "No clawbacks after payment",
                  "Stripe-powered payouts",
                  "Full payout history",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: theme.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.subtext }}>
                Delayed payouts protect everyone.
              </p>
            </motion.div>
          </div>
        )}
      </SectionShell>

      {/* Section: Rewards */}
      <SectionShell tone="light">
        {(theme) => (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <IconTag icon={Gift} label="Rewards" tone="light" />
              <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
                Earn more than commissions.
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
                Some creators add performance rewards when you hit revenue milestones.
              </p>
              <ul className="space-y-3 text-sm" style={{ color: theme.subtext }}>
                {[
                  "Milestone-based rewards",
                  "Progress tracked automatically",
                  "Unlock after real revenue",
                  "No extra work required",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: theme.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="rounded-[28px] border p-6 shadow-2xl"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Milestone progress</span>
                  <span style={{ color: theme.accent }}>FlowMetrics</span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs" style={{ color: theme.subtext }}>
                    <span>Revenue generated</span>
                    <span>$2,400 / $5,000</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-[#E7DED1]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "48%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentWarm})` }}
                    />
                  </div>
                  <div className="mt-2 text-xs" style={{ color: theme.subtext }}>
                    48% to next milestone
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { amount: "$1,000", reward: "1 month free", done: true },
                    { amount: "$2,500", reward: "Lifetime discount", active: true },
                    { amount: "$5,000", reward: "Exclusive tier access" },
                  ].map((milestone) => (
                    <div
                      key={milestone.amount}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: milestone.active ? "rgba(226,142,67,0.12)" : theme.bgAlt,
                      }}
                    >
                      <div>
                        <div className="font-semibold">{milestone.amount}</div>
                        <div className="text-xs" style={{ color: theme.subtext }}>
                          {milestone.reward}
                        </div>
                      </div>
                      <div className="h-9 w-9 rounded-full border p-2" style={{ borderColor: theme.border }}>
                        {milestone.done ? (
                          <Check className="h-full w-full" style={{ color: theme.accentWarm }} />
                        ) : (
                          <Sparkles className="h-full w-full" style={{ color: theme.subtext }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </SectionShell>

      {/* Section: Free */}
      <SectionShell tone="dark" className="text-center">
        {(theme) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl font-semibold md:text-5xl">
              Free for marketers. <span style={{ color: theme.accent }}>Always.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: theme.subtext }}>
              No subscriptions. No setup fees. No payout deductions.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {["Fees", "Subscriptions", "Hidden cuts"].map((item) => (
                <div
                  key={item}
                  className="flex flex-col items-center gap-4 rounded-3xl border px-6 py-8"
                  style={{ borderColor: theme.border, backgroundColor: theme.bgAlt }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ borderColor: theme.border }}>
                    <X className="h-6 w-6" style={{ color: theme.accent }} />
                  </div>
                  <div className="text-sm font-semibold">{item}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </SectionShell>

      {/* Section: Who it's for */}
      <SectionShell tone="light">
        {(theme) => (
          <div>
            <div className="text-center">
              <IconTag icon={Users} label="For You" tone="light" className="justify-center" />
              <h2 className="mt-4 text-4xl font-semibold md:text-5xl">
                Built for serious marketers.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: theme.subtext }}>
                If you care about real revenue, RevShare is for you.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Content creators", icon: LineChart },
                { title: "Indie marketers", icon: Sparkles },
                { title: "Influencers", icon: Users },
                { title: "Growth partners", icon: LayoutGrid },
                { title: "Agencies", icon: Wallet },
                { title: "Publishers", icon: Gift },
              ].map((persona) => (
                <div
                  key={persona.title}
                  className="flex items-center gap-4 rounded-3xl border px-6 py-6"
                  style={{ borderColor: theme.border, backgroundColor: theme.card }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: theme.border }}>
                    <persona.icon className="h-6 w-6" style={{ color: theme.accent }} />
                  </div>
                  <div className="text-base font-semibold">{persona.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionShell>

      {/* Final CTA */}
      <SectionShell tone="light">
        {(theme) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.7 }}
            className="rounded-[40px] border p-10 text-center md:p-16"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <h2 className="text-4xl font-semibold md:text-5xl">
              Start discovering better partnerships.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: theme.subtext }}>
              Explore programs, apply quickly, and start earning with full transparency.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base font-semibold shadow-lg transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: theme.accent, color: "#1C201C" }}
                asChild
              >
                <Link href="/projects">
                  Explore programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-full border px-8 text-base font-semibold transition-transform hover:scale-[1.02]"
                style={{ borderColor: theme.border, color: theme.accent }}
                asChild
              >
                <Link href="/signup">Create a marketer profile</Link>
              </Button>
            </div>
            <div className="mt-6 text-xs uppercase tracking-[0.2em]" style={{ color: theme.subtext }}>
              No credit card required
            </div>
          </motion.div>
        )}
      </SectionShell>
    </main>
  );
}

function V2Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { label: "Products", href: "/projects", hasDropdown: true },
    { label: "Solutions", href: "/projects", hasDropdown: true },
    { label: "Customers", href: "/marketers", hasDropdown: false },
    { label: "Resources", href: "/projects", hasDropdown: true },
  ];

  return (
    <header className="fixed top-0 z-50 w-full">
      <div
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 shadow-[0_18px_60px_rgba(12,10,8,0.45)]"
        style={{
          backgroundColor: "rgba(35,22,14,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E28E43]" />
          </span>
          <span className="tracking-tight">RevShare</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              {item.label}
              {item.hasDropdown ? <ChevronIcon /> : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 text-sm font-medium text-white/80 lg:flex">
          <Link href="/login" className="transition-colors hover:text-white">
            Log in
          </Link>
          <Button
            size="sm"
            className="h-10 rounded-full px-6 text-sm font-semibold shadow-lg"
            style={{ backgroundColor: "#F0A15B", color: "#2B1A0E" }}
            asChild
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        <div className="lg:hidden">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 rounded-full border border-white/20 text-white"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-4 rounded-full bg-white" />
              <span className="block h-0.5 w-4 rounded-full bg-white/80" />
            </div>
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="mx-auto mt-3 w-[92%] max-w-6xl rounded-3xl border border-white/10 bg-[#24160F]/95 p-6 text-white shadow-2xl lg:hidden">
          <div className="grid gap-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between">
                {item.label}
                {item.hasDropdown ? <ChevronIcon /> : null}
              </Link>
            ))}
            <div className="h-px bg-white/10" />
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="text-[#F0A15B]">
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SectionShell({
  tone,
  children,
  className,
}: {
  tone: "dark" | "light";
  children: (theme: typeof PALETTE.dark) => ReactNode;
  className?: string;
}) {
  const theme = PALETTE[tone];
  return (
    <section
      className={cn("relative overflow-hidden py-24 md:py-28", className)}
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              tone === "dark"
                ? "radial-gradient(circle at 15% 10%, rgba(155,229,143,0.12), transparent 50%)"
                : "radial-gradient(circle at 80% 10%, rgba(226,142,67,0.12), transparent 50%)",
          }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6">{children(theme)}</div>
    </section>
  );
}

function IconTag({
  icon: Icon,
  label,
  tone,
  className,
}: {
  icon: typeof Search;
  label: string;
  tone: "dark" | "light";
  className?: string;
}) {
  const theme = PALETTE[tone];
  return (
    <div className={cn("inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]", className)}>
      <Icon className="h-4 w-4" style={{ color: theme.accent }} />
      <span style={{ color: theme.accent }}>{label}</span>
    </div>
  );
}
