"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Check,
    Search,
    LayoutGrid,
    TrendingUp,
    Wallet,
    Eye,
    ShieldCheck,
    Zap,
    MousePointer2,
    Gift,
    Users,
    Sparkles,
    Moon,
    Sun
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Colors from images
const COLORS = {
    heroBg: "#0B1D17", // Dark Green
    heroText: "#F0FDF4",
    heroAccent: "#BEF264", // Light Lime Green
    orangeAccent: "#F28C5F", // Orange from logo/buttons
    enterpriseBg: "#2D1A12", // Dark Brown
    enterpriseText: "#FFFBF2",
    enterpriseAccent: "#F28C5F",
    whiteBg: "#FFFFFF",
    mutedText: "#6B7280",
};

export default function ForMarketersPage() {
    const [isDark, setIsDark] = React.useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const theme = isDark ? COLORS : {
        ...COLORS,
        heroBg: "#F0FDF4",
        heroText: "#0B1D17",
        heroAccent: "#166534",
        enterpriseBg: "#FFFBF2",
        enterpriseText: "#2D1A12",
        enterpriseAccent: "#D97706",
        whiteBg: "#0B1D17",
        mutedText: "#9CA3AF"
    };

    return (
        <div ref={containerRef} className={cn("relative transition-colors duration-700", isDark ? "bg-white" : "bg-gray-950")}>
            <Navbar />

            {/* Theme Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDark(!isDark)}
                className="fixed bottom-10 right-10 z-[100] h-16 w-16 rounded-full bg-black text-white shadow-2xl flex items-center justify-center border-4 border-white/10 overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {isDark ? (
                        <motion.div
                            key="moon"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                        >
                            <Moon className="h-6 w-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                        >
                            <Sun className="h-6 w-6 text-yellow-400" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* 1. Hero Section (Image 0 Influence) */}
            <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-20 overflow-hidden" style={{ backgroundColor: theme.heroBg }}>
                {/* Background Gradients */}
                <motion.div
                    style={{ y: useTransform(smoothProgress, [0, 0.2], [0, -100]) }}
                    className="absolute top-0 right-0 w-[800px] h-[800px] bg-lime-500/10 blur-[150px] rounded-full pointer-events-none"
                />

                {/* Floating Arrows (from Image 0) */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 0.15, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                            className="absolute text-lime-400"
                            style={{
                                top: `${15 + i * 12}%`,
                                left: `${55 + i * 4}%`,
                            }}
                        >
                            <Zap className="h-8 w-8" />
                        </motion.div>
                    ))}
                </div>

                <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-2xl"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm mb-10"
                        >
                            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                            Premium Network for Experts
                        </motion.div>

                        <h1 className="text-6xl md:text-8xl font-semibold leading-[1.05] tracking-tight mb-10" style={{ color: theme.heroText }}>
                            Built for your next stage of <span className="text-lime-400">growth.</span>
                        </h1>

                        <p className="text-xl md:text-2xl mb-12 leading-relaxed text-white/70 max-w-xl">
                            RevShare connects high-quality products with an army of expert sellers. Discover programs, track real revenue, and get paid transparently.
                        </p>

                        <div className="flex flex-wrap items-center gap-6">
                            <Button
                                size="lg"
                                className="h-16 rounded-full px-10 text-xl font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95"
                                style={{ backgroundColor: theme.heroAccent, color: isDark ? "#000" : "#fff" }}
                                asChild
                            >
                                <Link href="/projects" className="flex items-center gap-3">
                                    Get Started
                                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.orangeAccent }}>
                                        <ArrowRight className="h-4 w-4 text-white" />
                                    </div>
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                className={cn("h-16 rounded-full px-10 text-xl font-semibold hover:bg-white/5 border border-white/10", isDark ? "text-white" : "text-black border-black/10")}
                                asChild
                            >
                                <Link href="/signup">Marketer Profile</Link>
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{
                            y: useTransform(smoothProgress, [0, 0.2], [0, 50]),
                            rotate: useTransform(smoothProgress, [0, 0.2], [2, 0])
                        }}
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="relative"
                    >
                        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl p-2 shadow-2xl overflow-hidden group">
                            <Image
                                src="/hero-dashboard.png"
                                alt="RevShare Dashboard"
                                width={1200}
                                height={800}
                                className="rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]"
                            />

                            {/* Floating Overlay Card */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-10 -left-10 p-8 rounded-3xl bg-white text-black shadow-2xl hidden md:block border border-gray-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-lime-400 flex items-center justify-center font-bold text-2xl shadow-lg shadow-lime-400/20">
                                        $
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Available Now</p>
                                        <p className="text-3xl font-black">$12,480.00</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Quote Section (Dark/Light Transition) */}
            <section className="py-32 bg-white overflow-hidden relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="max-w-5xl mx-auto text-center"
                    >
                        <p className="text-4xl md:text-6xl font-medium tracking-tight text-gray-200 leading-[1.1] mb-4">
                            "Switching to RevShare has been an absolute <span className="text-black italic">game-changer.</span> I finally have a dashboard that shows me exactly what I'm earning in real-time."
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-12">
                            <div className="h-12 w-12 rounded-full bg-gray-100" />
                            <div className="text-left">
                                <p className="font-bold">Alex Rivera</p>
                                <p className="text-sm text-gray-400 uppercase tracking-widest">Growth Marketer</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Section: Discovery (Image 1 Influence) */}
            <section className="py-40 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-32 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            style={{ y: useTransform(smoothProgress, [0.2, 0.4], [50, -50]) }}
                            className="relative order-2 lg:order-1"
                        >
                            <div className="relative rounded-3xl border border-gray-100 bg-white p-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] group overflow-hidden">
                                <Image
                                    src="/discovery-directory.png"
                                    alt="Discovery Directory"
                                    width={1000}
                                    height={800}
                                    className="rounded-2xl group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-20" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 lg:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-widest mb-8 border border-orange-100">
                                <Search className="h-3 w-3" />
                                Discovery Engine
                            </div>
                            <h2 className="text-5xl md:text-7xl font-semibold mb-8 tracking-tighter leading-[1.1]">
                                Discover programs <br />
                                <span className="text-orange-500">no DMs, no spreadsheets.</span>
                            </h2>
                            <p className="text-xl text-gray-500 mb-12 leading-relaxed">
                                Browse public revenue-share programs and filter by commission rate, revenue, category, or business model. See what actually converts *before* you apply.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                {[
                                    "Public project directory",
                                    "Search by revenue & niche",
                                    "Top-performer leaderboards",
                                    "New programs daily"
                                ].map(item => (
                                    <div key={item} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Check className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <span className="font-semibold text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Earnings Transparency (Image 1 Style) */}
            <section className="py-40 bg-gray-50/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-32 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="max-w-xl"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-50 text-lime-600 text-xs font-bold uppercase tracking-widest mb-8 border border-lime-100">
                                <Eye className="h-3 w-3" />
                                Full Transparency
                            </div>
                            <h2 className="text-5xl md:text-7xl font-semibold mb-8 tracking-tighter leading-[1.1]">
                                See exactly what you earn — <span className="text-lime-600 italic">and why.</span>
                            </h2>
                            <p className="text-xl text-gray-500 mb-12 leading-relaxed">
                                Every sale, commission, adjustment, and payout is visible. No hidden rules. No silent deductions. We value your trust above all.
                            </p>
                            <ul className="space-y-6">
                                {[
                                    "Earnings broken down by project",
                                    "Pending vs available commissions",
                                    "Refund-window aware tracking",
                                    "Full audit trail for every change"
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-4 text-lg">
                                        <div className="flex h-7 w-7 rounded-full bg-lime-500 items-center justify-center shadow-lg shadow-lime-500/20">
                                            <Check className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="font-medium text-gray-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="p-10 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_48px_96px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
                                <div className="flex items-center justify-between mb-12 pb-8 border-b border-gray-50">
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">My Total Earning</p>
                                        <p className="text-5xl font-black tracking-tight">$42,850.20</p>
                                    </div>
                                    <div className="h-16 w-16 rounded-3xl bg-lime-500/10 flex items-center justify-center text-lime-600">
                                        <TrendingUp className="h-8 w-8" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { label: "Cash Available", value: "$32.4K", color: "bg-lime-500", percent: 75 },
                                        { label: "Pending Payout", value: "$10.4K", color: "bg-orange-500", percent: 25 }
                                    ].map(stat => (
                                        <div key={stat.label} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-600">{stat.label}</span>
                                                <span className="font-black text-xl">{stat.value}</span>
                                            </div>
                                            <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${stat.percent}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className={`h-full ${stat.color} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Payout Activity */}
                                <div className="mt-12 pt-8 border-t border-gray-50">
                                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-6">Recent Activity</p>
                                    <div className="space-y-4">
                                        {[
                                            { type: 'Commission', amount: '+$420', status: 'Verified' },
                                            { type: 'Stripe Payout', amount: '-$1,200', status: 'Completed' }
                                        ].map((act, i) => (
                                            <div key={i} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-2 w-2 rounded-full ${act.amount.startsWith('+') ? 'bg-lime-500' : 'bg-gray-400'}`} />
                                                    <span className="font-bold text-sm">{act.type}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black">{act.amount}</p>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">{act.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. Section: Payouts (Image 2 Influence - Dark Brown) */}
            <section className="py-40 relative overflow-hidden" style={{ backgroundColor: theme.enterpriseBg }}>
                {/* Background Dots */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-24 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-orange-400 text-xs font-bold uppercase tracking-widest mb-10 border border-white/10">
                            <ShieldCheck className="h-3 w-3" />
                            Reliable Payouts
                        </div>
                        <h2 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter leading-[1] max-w-4xl" style={{ color: theme.enterpriseText }}>
                            Get paid reliably, <br />
                            <span className="text-orange-400 italic">not randomly.</span>
                        </h2>
                        <p className="text-2xl text-white/50 max-w-2xl leading-relaxed">
                            Commissions unlock automatically as soon as the refund window ends. No more chasing founders for DMs or invoices.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-10">
                        {[
                            {
                                title: "Predictable Schedules",
                                desc: "Our automated ledger manages every cent from sale to bank deposit. We eliminate the 'check is in the mail' culture.",
                                before: "Manual tracking in messy spreadsheets and late night DMs about payouts.",
                                after: "Precision automated payouts via Stripe Connect with real-time audit trails."
                            },
                            {
                                title: "Risk-Free Earnings",
                                desc: "We align payout schedules with refund windows to prevent clawbacks. Once it shows as available, it's yours to keep.",
                                before: "Revenue clawbacks and unexpected deductions that ruin your cashflow.",
                                after: "Locked-in earnings with clear protection timelines for complete peace of mind."
                            }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                                viewport={{ once: true }}
                                className="p-12 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col group hover:bg-white/10 transition-all duration-500 hover:-translate-y-2"
                            >
                                <div className="h-14 w-14 rounded-3xl bg-orange-500/20 flex items-center justify-center mb-10 border border-orange-500/30">
                                    <Check className="h-7 w-7 text-orange-500" />
                                </div>
                                <h3 className="text-3xl font-bold mb-6 text-white tracking-tight">{card.title}</h3>
                                <p className="text-xl text-white/50 mb-12 leading-relaxed">{card.desc}</p>

                                <div className="mt-auto space-y-8 pt-10 border-t border-white/10">
                                    <div className="opacity-40">
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Legacy Process</p>
                                        <p className="text-base text-white/70 italic leading-snug">{card.before}</p>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-lime-400 rounded-full" />
                                        <p className="text-[10px] font-bold text-lime-400 uppercase tracking-widest mb-4">The RevShare Way</p>
                                        <p className="text-lg text-white font-medium leading-snug">{card.after}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Performance Rewards (Image 3 Style - Floating Cards) */}
            <section className="py-40 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-32 items-center">
                        <div className="relative order-2 lg:order-1 h-[600px] flex items-center justify-center">
                            {/* Visual Reward Stack */}
                            <motion.div
                                style={{ y: useTransform(smoothProgress, [0.6, 0.9], [100, -100]) }}
                                className="relative z-10"
                            >
                                <div className="p-10 rounded-[3rem] bg-[#2D1A12] text-white shadow-2xl w-[320px] relative overflow-hidden group">
                                    <div className="h-20 w-20 rounded-[2rem] bg-orange-500 flex items-center justify-center mb-8 shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                        <Gift className="h-10 w-10" />
                                    </div>
                                    <p className="text-3xl font-black mb-2">Elite Tier</p>
                                    <p className="text-lg text-white/50 mb-8">Unlocked at $10k rev</p>
                                    <div className="py-3 px-6 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-2 font-bold">
                                        <Zap className="h-4 w-4 text-orange-400" />
                                        +5% Commission
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ x: 50, y: 50, opacity: 0 }}
                                    whileInView={{ x: -80, y: -40, opacity: 1 }}
                                    className="absolute -top-10 -left-10 p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-2xl z-20 w-[240px]"
                                >
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Milestone</p>
                                    <div className="h-4 w-full bg-gray-50 rounded-full mb-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '85%' }}
                                            transition={{ duration: 1.5, delay: 1 }}
                                            className="h-full bg-lime-500 rounded-full"
                                        />
                                    </div>
                                    <p className="text-2xl font-black">85% to Pro+</p>
                                </motion.div>
                            </motion.div>

                            {/* Decorative Background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
                                <Users className="h-[500px] w-[500px]" />
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 lg:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-widest mb-8 border border-purple-100">
                                <Sparkles className="h-3 w-3" />
                                Growth Incentives
                            </div>
                            <h2 className="text-5xl md:text-8xl font-semibold mb-8 tracking-tighter leading-[1.1]">
                                Earn more than <br /> <span className="text-orange-500 italic">commissions.</span>
                            </h2>
                            <p className="text-xl text-gray-500 mb-12 leading-relaxed">
                                Many creators offer high-performance rewards when you hit revenue milestones — ranging from free upgraded accounts to exclusive partner profit-sharing.
                            </p>
                            <Button
                                size="lg"
                                className="h-16 rounded-full px-10 text-xl font-bold bg-black text-white hover:bg-gray-900 transition-all hover:scale-105"
                                asChild
                            >
                                <Link href="/projects">View Partner Bonuses</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 7. Always Free for Marketers (Simple, Clean) */}
            <section className="py-40 bg-gray-50/50">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter">Free for marketers. <span className="text-orange-500 italic">Always.</span></h2>
                        <p className="text-2xl text-gray-400 mb-20 max-w-2xl mx-auto leading-relaxed">
                            RevShare strictly charges creators, not the experts. No monthly fees, no bank transfer costs, no hidden platform cuts.
                        </p>

                        <div className="grid md:grid-cols-3 gap-12">
                            {[
                                { icon: MousePointer2, label: "Zero Subscriptions" },
                                { icon: Wallet, label: "Zero Platform Fees" },
                                { icon: Zap, label: "Instant Enrollment" }
                            ].map(item => (
                                <motion.div
                                    key={item.label}
                                    whileHover={{ y: -10 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-6 border border-gray-50 text-orange-500">
                                        <item.icon className="h-10 w-10" strokeWidth={2.5} />
                                    </div>
                                    <span className="font-extrabold text-lg text-gray-800 uppercase tracking-widest">{item.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA (Image 3 Influence) */}
            <section className="py-40 bg-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-[5rem] bg-gray-50 p-20 md:p-32 overflow-hidden text-center border border-gray-100"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none flex items-center justify-center grayscale">
                            <LayoutGrid className="h-[800px] w-[800px]" />
                        </div>

                        <h2 className="text-5xl md:text-9xl font-black mb-12 tracking-tighter relative z-10 leading-[0.9]">
                            Ready for a partner <br /> built for <span className="text-lime-600 italic">you?</span>
                        </h2>

                        <div className="flex flex-wrap items-center justify-center gap-8 relative z-10">
                            <Button
                                size="lg"
                                className="h-20 rounded-full px-16 text-2xl font-black shadow-[0_32px_64px_-12px_rgba(190,242,100,0.5)] transition-all hover:scale-110 active:scale-95"
                                style={{ backgroundColor: theme.heroAccent, color: isDark ? "#000" : "#fff" }}
                                asChild
                            >
                                <Link href="/projects">Explore Projects</Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-20 rounded-full px-16 text-2xl font-black border-4 hover:bg-white transition-all hover:scale-105"
                                asChild
                            >
                                <Link href="/login">Marketer Login</Link>
                            </Button>
                        </div>

                        <div className="mt-16 text-gray-400 font-bold uppercase tracking-[0.2em] relative z-10">
                            Started in 60 seconds • No Credit Card Required
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer Mock (Image 3 Style) */}
            <footer className="py-20 bg-white border-t border-gray-100">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                        <div>
                            <p className="font-bold mb-6">Product</p>
                            <ul className="space-y-4 text-gray-500">
                                <li>For Marketers</li>
                                <li>For Creators</li>
                                <li>Marketplace</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-bold mb-6">Company</p>
                            <ul className="space-y-4 text-gray-500">
                                <li>About</li>
                                <li>Careers</li>
                                <li>Privacy</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-bold mb-6">Support</p>
                            <ul className="space-y-4 text-gray-500">
                                <li>Help Center</li>
                                <li>Contact</li>
                                <li>Stripe Guide</li>
                            </ul>
                        </div>
                        <div className="col-span-1">
                            <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                                R
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-gray-50 text-gray-400 text-sm">
                        <p>© 2026 RevShare Inc. Built for the army of sellers.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <span>Twitter</span>
                            <span>LinkedIn</span>
                            <span>Discord</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
