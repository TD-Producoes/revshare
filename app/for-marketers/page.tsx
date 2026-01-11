"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Eye,
  Gift,
  LayoutGrid,
  LineChart,
  PenLine,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Campfire Color Palette
const COLORS = {
  dark: {
    bg: "#3D2B1F",
    card: "#4A3728",
    cardBorder: "#5A4738",
    text: "#FFFFFF",
    subtext: "#C4A98A",
    accent: "#E8A87C",
  },
  light: {
    bg: "#FFF8F0",
    card: "#FFFFFF",
    cardBorder: "#E6DCCA",
    text: "#3D2B1F",
    subtext: "#8A7A6A",
    accent: "#D97706", // Slightly darker orange for contrast on light
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function ForMarketersPage() {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? COLORS.dark : COLORS.light;

  // Smooth scroll progress for parallax or styling
  const { scrollYProgress } = useScroll();

  return (
    <main
      className={cn(
        "relative min-h-screen transition-colors duration-700 ease-in-out",
        isDark ? "selection:bg-[#E8A87C]/30" : "selection:bg-[#D97706]/20"
      )}
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <Navbar />

      {/* Theme Toggle - Floating */}
      <motion.button
        onClick={() => setIsDark(!isDark)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-2xl backdrop-blur-md border transition-all"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(61,43,31,0.1)",
          borderColor: theme.cardBorder,
          color: theme.accent,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </motion.button>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          {isDark ? (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5A3E2B]/50 via-[#3D2B1F] to-[#3D2B1F]" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4C4]/30" />
          )}
          {/* Sun/Glow Effect */}
          <motion.div
            animate={{
              opacity: isDark ? 0.8 : 0.6,
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl pointer-events-none"
            style={{
              background: isDark
                ? "radial-gradient(circle, #E8A87C 0%, transparent 70%)"
                : "radial-gradient(circle, #FFD700 0%, transparent 70%)",
            }}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          {/* Tag */}
          <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border"
              style={{
                borderColor: isDark ? "#E8A87C20" : "#D9770620",
                backgroundColor: isDark ? "#E8A87C10" : "#D9770610",
                color: theme.accent,
              }}
            >
              For Marketers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8"
          >
            Find revenue-share programs{" "}
            <span style={{ color: theme.accent }}>you can trust.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto mb-12"
            style={{ color: theme.subtext }}
          >
            RevShare is a public marketplace where marketers discover real programs,
            track real revenue, and get paid transparently — no upfront costs, ever.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-5 mb-16">
            <Button
              size="lg"
              className="h-14 rounded-full px-10 text-lg font-semibold shadow-xl transition-transform hover:scale-105"
              style={{
                backgroundColor: theme.accent,
                color: isDark ? "#3D2B1F" : "#FFFFFF",
              }}
              asChild
            >
              <Link href="/projects">
                Explore programs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-14 rounded-full px-10 text-lg border transition-transform hover:scale-105"
              style={{
                color: theme.accent,
                borderColor: isDark ? "#E8A87C30" : "#D9770630",
                backgroundColor: "transparent",
              }}
              asChild
            >
              <Link href="/signup">
                Create a marketer profile
              </Link>
            </Button>
          </motion.div>

          {/* Trust Bullets */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-8 text-sm md:text-base font-medium" style={{ color: theme.subtext }}>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" style={{ color: theme.accent }} />
              <span>No subscriptions</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" style={{ color: theme.accent }} />
              <span>Real revenue only</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" style={{ color: theme.accent }} />
              <span>Transparent payouts</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2: Discover Programs */}
      <SectionWrapper theme={theme}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <IconTag icon={Search} label="Discovery" theme={theme} />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Discover programs —{" "}
              <span style={{ color: theme.accent }}>no DMs, no spreadsheets.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
              Browse public revenue-share programs and filter by commission rate,
              revenue, category, or business model. See what actually converts before you apply.
            </p>
            <ul className="space-y-4">
              {[
                "Public project directory",
                "Search by commission %, revenue, and niche",
                "Leaderboards showing top-performing programs",
                "New programs published every day",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent + '20' }}>
                    <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  </div>
                  <span style={{ color: theme.subtext }}>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <Card theme={theme} className="p-0 overflow-hidden shadow-2xl">
              <div className="p-6 border-b" style={{ borderColor: theme.cardBorder }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" style={{ color: theme.accent }} />
                    <span className="font-medium">Programs</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: theme.bg, borderColor: theme.cardBorder }}>
                    <Search className="h-4 w-4" style={{ color: theme.subtext }} />
                    <span className="text-sm" style={{ color: theme.subtext }}>Search...</span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-opacity-50">
                {[
                  { name: "FlowMetrics", commission: "25%", revenue: "$42K/mo", category: "Analytics" },
                  { name: "BuildStack", commission: "20%", revenue: "$28K/mo", category: "DevTools" },
                  { name: "CopyGenius", commission: "30%", revenue: "$18K/mo", category: "AI Writing" },
                ].map((program, i) => (
                  <div
                    key={program.name}
                    className="flex items-center justify-between p-4 rounded-xl transition-colors"
                    style={{
                      backgroundColor: i === 0 ? theme.accent + '15' : 'transparent',
                      border: i === 0 ? `1px solid ${theme.accent}40` : `1px solid ${theme.cardBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
                        {program.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{program.name}</p>
                        <p className="text-sm" style={{ color: theme.subtext }}>{program.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: theme.accent }}>{program.commission}</p>
                      <p className="text-sm" style={{ color: theme.subtext }}>{program.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Section 3: Apply Once */}
      <SectionWrapper theme={theme}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative"
          >
            <Card theme={theme} className="p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <span className="font-medium text-lg">My Offers</span>
                <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
                  3 Active
                </span>
              </div>
              <div className="space-y-4">
                {[
                  { name: "FlowMetrics Pro", status: "Active", link: "flow.ref/abc123" },
                  { name: "BuildStack Teams", status: "Active", link: "build.ref/xyz789" },
                  { name: "CopyGenius AI", status: "Pending", link: "—" },
                ].map((offer) => (
                  <div
                    key={offer.name}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ backgroundColor: isDark ? "#3D2B1F" : "#F8F0E6" }}
                  >
                    <div>
                      <p className="font-medium">{offer.name}</p>
                      <p className="text-sm font-mono mt-1" style={{ color: theme.subtext }}>{offer.link}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${offer.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-orange-500/10 text-orange-500"
                      }`}>
                      {offer.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8 order-1 lg:order-2"
          >
            <IconTag icon={PenLine} label="Simplicity" theme={theme} />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Apply once.{" "}
              <span style={{ color: theme.accent }}>Everything else just works.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
              Apply to programs directly on RevShare. Once approved, you get instant access
              to links, coupons, and performance tracking — all in one place.
            </p>
            <ul className="space-y-4">
              {[
                "Simple application flow",
                "All approved offers in one dashboard",
                "No back-and-forth emails",
                "Clear program terms upfront",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent + '20' }}>
                    <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  </div>
                  <span style={{ color: theme.subtext }}>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Section 4: Transparency */}
      <SectionWrapper theme={theme}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <IconTag icon={Eye} label="Transparency" theme={theme} />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              See exactly what you earn —{" "}
              <span style={{ color: theme.accent }}>and why.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
              Every sale, commission, adjustment, and payout is visible.
              No hidden rules. No silent deductions.
            </p>
            <ul className="space-y-4">
              {[
                "Earnings broken down by project",
                "Pending vs available commissions",
                "Refund-window aware tracking",
                "Full audit trail for every change",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent + '20' }}>
                    <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  </div>
                  <span style={{ color: theme.subtext }}>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <Card theme={theme} className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="grid grid-cols-2 gap-4 mb-6 relative">
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.cardBorder }}>
                  <p className="text-sm mb-1" style={{ color: theme.subtext }}>Total Earned</p>
                  <p className="text-2xl font-bold">$4,280</p>
                  <p className="text-xs text-emerald-500 mt-1 font-medium">+12% this month</p>
                </div>
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.cardBorder }}>
                  <p className="text-sm mb-1" style={{ color: theme.subtext }}>Pending</p>
                  <p className="text-2xl font-bold" style={{ color: theme.accent }}>$840</p>
                  <p className="text-xs mt-1" style={{ color: theme.subtext }}>3 sales in window</p>
                </div>
              </div>

              <div className="space-y-2 relative">
                <p className="text-sm font-medium mb-3" style={{ color: theme.subtext }}>Recent Activity</p>
                {[
                  { type: "Sale", amount: "+$48.00", project: "FlowMetrics", time: "2h ago" },
                  { type: "Payout", amount: "$420.00", project: "Monthly", time: "3d ago" },
                  { type: "Refund", amount: "-$24.00", project: "BuildStack", time: "5d ago" },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: theme.cardBorder }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activity.type === "Sale" ? "bg-emerald-500/10" :
                        activity.type === "Payout" ? "bg-blue-500/10" : "bg-red-500/10"
                        }`}>
                        {activity.type === "Sale" ? <TrendingUp className="h-4 w-4 text-emerald-500" /> :
                          activity.type === "Payout" ? <Wallet className="h-4 w-4 text-blue-500" /> :
                            <ArrowUpRight className="h-4 w-4 text-red-500 rotate-180" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.type}</p>
                        <p className="text-xs" style={{ color: theme.subtext }}>{activity.project}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${activity.type === "Sale" ? "text-emerald-500" :
                        activity.type === "Payout" ? "" : "text-red-500"
                        }`}>{activity.amount}</p>
                      <p className="text-xs" style={{ color: theme.subtext }}>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Section 5: Payouts */}
      <SectionWrapper theme={theme}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, rotateX: 10 }}
            whileInView={{ opacity: 1, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative"
          >
            <Card theme={theme} className="p-8">
              <div className="flex items-center gap-2 mb-8">
                <CreditCard className="h-6 w-6" style={{ color: theme.accent }} />
                <span className="font-semibold text-lg">Payout Schedule</span>
              </div>
              <div className="space-y-6">
                {[
                  { date: "Jan 15", amount: "$420.00", status: "Paid" },
                  { date: "Feb 15", amount: "$580.00", status: "Paid" },
                  { date: "Mar 15", amount: "$840.00", status: "Processing" },
                  { date: "Apr 15", amount: "$640.00", status: "Scheduled" },
                ].map((payout, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${payout.status === "Paid" ? "bg-emerald-500" :
                      payout.status === "Processing" ? "animate-pulse" : ""
                      }`} style={{ backgroundColor: payout.status === "Processing" || payout.status === "Scheduled" ? theme.cardBorder : undefined, color: payout.status === "Processing" ? theme.accent : undefined }}>
                      {/* Custom Logic for processing/scheduled colors if not using tw classes totally */}
                      {payout.status === "Processing" && <div className="w-full h-full rounded-full" style={{ backgroundColor: theme.accent }} />}
                      {payout.status === "Scheduled" && <div className="w-full h-full rounded-full opacity-50" style={{ backgroundColor: theme.subtext }} />}
                    </div>
                    <div className="flex-1 flex items-center justify-between p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bg, borderColor: theme.cardBorder }}>
                      <div>
                        <p className="text-sm font-medium">{payout.date}</p>
                        <p className="text-xs" style={{ color: theme.subtext }}>{payout.status}</p>
                      </div>
                      <p className="text-sm font-bold">{payout.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl border flex items-center gap-3" style={{ backgroundColor: theme.bg, borderColor: theme.cardBorder }}>
                <Shield className="h-5 w-5" style={{ color: theme.accent }} />
                <span className="text-sm" style={{ color: theme.subtext }}>Powered by Stripe Connect</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8 order-1 lg:order-2"
          >
            <IconTag icon={Wallet} label="Reliability" theme={theme} />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Get paid reliably,{" "}
              <span style={{ color: theme.accent }}>not randomly.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
              Commissions unlock only after the refund window ends.
              Once available, payouts are processed transparently via Stripe.
            </p>
            <ul className="space-y-4">
              {[
                "Clear payout timelines",
                "No clawbacks after payment",
                "Stripe-powered payouts",
                "Full payout history and references",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent + '20' }}>
                    <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  </div>
                  <span style={{ color: theme.subtext }}>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm italic opacity-80" style={{ color: theme.subtext }}>
              Delayed payouts protect everyone — and eliminate disputes.
            </p>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Section 6: Performance Rewards */}
      <SectionWrapper theme={theme}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <IconTag icon={Gift} label="Rewards" theme={theme} />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Earn more than{" "}
              <span style={{ color: theme.accent }}>commissions.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: theme.subtext }}>
              Some creators offer performance-based rewards when you hit revenue milestones —
              like free subscriptions, upgrades, or exclusive access.
            </p>
            <ul className="space-y-4">
              {[
                "Milestone-based rewards",
                "Progress tracked automatically",
                "Unlock after real revenue (post-refunds)",
                "No extra work required",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent + '20' }}>
                    <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  </div>
                  <span style={{ color: theme.subtext }}>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <Card theme={theme} className="p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <span className="font-medium text-lg">Milestone Progress</span>
                <span className="text-sm" style={{ color: theme.accent }}>FlowMetrics</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: theme.subtext }}>Revenue Generated</span>
                  <span className="font-medium">$2,400 / $5,000</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: theme.bg }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "48%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${theme.accent}, #F5C89A)` }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: theme.subtext }}>48% to next milestone</p>
              </div>

              <div className="space-y-3">
                {[
                  { amount: "$1,000", reward: "1 month free", unlocked: true },
                  { amount: "$2,500", reward: "Lifetime discount", unlocked: false, current: true },
                  { amount: "$5,000", reward: "Exclusive tier access", unlocked: false },
                ].map((milestone, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: milestone.current ? theme.accent + '15' : theme.bg,
                      border: milestone.current ? `1px solid ${theme.accent}40` : `1px solid ${theme.cardBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${milestone.unlocked ? "bg-emerald-500/10" : ""
                        }`} style={{ backgroundColor: !milestone.unlocked && !milestone.current ? theme.cardBorder : undefined }}>
                        {milestone.unlocked ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Sparkles className="h-4 w-4" style={{ color: theme.subtext }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{milestone.amount}</p>
                        <p className="text-xs" style={{ color: theme.subtext }}>{milestone.reward}</p>
                      </div>
                    </div>
                    {milestone.unlocked && (
                      <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Section 7: Free for Marketers - Centered */}
      <section className="py-32 relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
            Free for marketers.{" "}
            <span style={{ color: theme.accent }}>Always.</span>
          </h2>
          <p className="text-xl mb-16 max-w-2xl mx-auto" style={{ color: theme.subtext }}>
            RevShare never charges marketers. No subscriptions. No setup fees. No payout deductions.
          </p>

          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { icon: X, label: "Fees" },
              { icon: X, label: "Subscriptions" },
              { icon: X, label: "Hidden cuts" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="h-20 w-20 rounded-3xl flex items-center justify-center border-2" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                  <item.icon className="h-8 w-8" strokeWidth={3} style={{ color: theme.accent }} />
                </div>
                <span className="font-medium" style={{ color: theme.subtext }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Section 8: Personas */}
      <SectionWrapper theme={theme}>
        <div className="text-center mb-16">
          <IconTag icon={Users} label="For You" theme={theme} className="mx-auto" />
          <h2 className="text-4xl md:text-5xl font-bold mt-6">
            Built for{" "}
            <span style={{ color: theme.accent }}>serious marketers.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Content Creators", icon: PenLine },
            { title: "Indie Marketers", icon: TrendingUp },
            { title: "Influencers", icon: Users },
            { title: "Growth Partners", icon: LineChart },
            { title: "Agencies", icon: LayoutGrid },
            { title: "Publishers", icon: Sparkles },
          ].map((persona, i) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-4 p-8 rounded-2xl border transition-all"
              style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
            >
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.accent + '15' }}>
                <persona.icon className="h-6 w-6" style={{ color: theme.accent }} />
              </div>
              <span className="font-medium text-lg">{persona.title}</span>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-lg mt-12" style={{ color: theme.subtext }}>
          If you care about real revenue — not vanity metrics — RevShare is for you.
        </p>
      </SectionWrapper>


      {/* Final CTA */}
      <section className="py-32 relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto rounded-[3rem] p-12 md:p-24 text-center border relative overflow-hidden"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${theme.card}, ${COLORS.dark.bg})`
              : `linear-gradient(135deg, ${theme.card}, #FFF8F0)`,
            borderColor: theme.cardBorder
          }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/20 blur-[100px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/10 blur-[100px] rounded-full mix-blend-screen" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 relative z-10">
            Start discovering{" "}
            <span style={{ color: theme.accent }}>better partnerships.</span>
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-5 mb-8 relative z-10">
            <Button
              size="lg"
              className="h-14 rounded-full px-10 text-lg font-semibold shadow-xl transition-transform hover:scale-105"
              style={{
                backgroundColor: theme.accent,
                color: isDark ? "#3D2B1F" : "#FFFFFF",
              }}
              asChild
            >
              <Link href="/projects">
                Explore programs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-14 rounded-full px-10 text-lg border transition-transform hover:scale-105"
              style={{
                color: theme.accent,
                borderColor: isDark ? "#E8A87C30" : "#D9770630",
                backgroundColor: "transparent",
              }}
              asChild
            >
              <Link href="/signup">
                Create a marketer profile
              </Link>
            </Button>
          </div>

          <p className="text-sm opacity-70 relative z-10" style={{ color: theme.subtext }}>
            No credit card required.
          </p>
        </motion.div>
      </section>

      <Footer />
      <div className="h-6" />
    </main>
  );
}

// Subcomponents for cleaner code
function SectionWrapper({ children, theme, className }: { children: React.ReactNode; theme: any; className?: string }) {
  return (
    <section className={cn("py-24 md:py-32 relative z-10 px-6", className)}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

function Card({ children, theme, className }: { children: React.ReactNode; theme: any; className?: string }) {
  return (
    <div
      className={cn("rounded-3xl border transition-colors duration-500", className)}
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      {children}
    </div>
  );
}

function IconTag({ icon: Icon, label, theme, className }: { icon: any; label: string; theme: any; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 mb-6", className)}>
      <Icon className="h-5 w-5" style={{ color: theme.accent }} />
      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
        {label}
      </span>
    </div>
  );
}
