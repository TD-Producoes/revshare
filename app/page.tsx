"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/data/metrics";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  CreditCard,
  DollarSign,
  FileCheck,
  BarChart3,
  Layers,
  Wallet,
  FileSignature,
  PlugZap,
  Ticket,
  LineChart,
  PieChart,
  ReceiptText,
  Banknote,
} from "lucide-react";

const topMarketers = [
  {
    name: "Lara Finch",
    focus: "B2B SaaS",
    revenue: 84500,
    commission: 16900,
    activeProjects: 6,
    trend: "+12%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lara",
  },
  {
    name: "Koji Tanaka",
    focus: "E-commerce",
    revenue: 78200,
    commission: 15640,
    activeProjects: 8,
    trend: "+5%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Koji",
  },
  {
    name: "Tiago Mark",
    focus: "Dev Tools",
    revenue: 61200,
    commission: 12240,
    activeProjects: 4,
    trend: "+8%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Tiago",
  },
  {
    name: "Elena Rodriguez",
    focus: "Web3",
    revenue: 58900,
    commission: 11780,
    activeProjects: 5,
    trend: "+22%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
  },
  {
    name: "Ava Chen",
    focus: "Creator Apps",
    revenue: 49800,
    commission: 9960,
    activeProjects: 5,
    trend: "+24%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ava",
  },
  {
    name: "Marcus Reid",
    focus: "Fintech",
    revenue: 45200,
    commission: 9040,
    activeProjects: 3,
    trend: "+15%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus",
  },
  {
    name: "Sarah Lee",
    focus: "AI Tools",
    revenue: 38500,
    commission: 7700,
    activeProjects: 5,
    trend: "+2%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
  },
  {
    name: "David Kim",
    focus: "HealthTech",
    revenue: 32100,
    commission: 6420,
    activeProjects: 4,
    trend: "+9%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=David",
  },
  {
    name: "Priya Patel",
    focus: "EdTech",
    revenue: 28400,
    commission: 5680,
    activeProjects: 2,
    trend: "+18%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya",
  },
  {
    name: "Sam Wilson",
    focus: "Marketing",
    revenue: 22100,
    commission: 4420,
    activeProjects: 3,
    trend: "+4%",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sam",
  },
];

const topProjects = [
  {
    name: "SocialPulse",
    category: "Social Media",
    revenue: 150000,
    marketers: 12,
    commission: 30000,
    growth: "+20%",
    image: "https://ui-avatars.com/api/?name=SP&background=EC4899&color=fff",
  },
  {
    name: "CryptoTracker",
    category: "Web3",
    revenue: 130500,
    marketers: 20,
    commission: 26100,
    growth: "+40%",
    image: "https://ui-avatars.com/api/?name=CT&background=F59E0B&color=fff",
  },
  {
    name: "BuildPublic",
    category: "Creator Tools",
    revenue: 121000,
    marketers: 9,
    commission: 24200,
    growth: "+15%",
    image: "https://ui-avatars.com/api/?name=BP&background=2563EB&color=fff",
  },
  {
    name: "Designify",
    category: "Design Tools",
    revenue: 110200,
    marketers: 15,
    commission: 22040,
    growth: "+12%",
    image: "https://ui-avatars.com/api/?name=DS&background=8B5CF6&color=fff",
  },
  {
    name: "TaskMaster",
    category: "Productivity",
    revenue: 95400,
    marketers: 8,
    commission: 19080,
    growth: "+5%",
    image: "https://ui-avatars.com/api/?name=TM&background=10B981&color=fff",
  },
  {
    name: "Flowdesk Pro",
    category: "Sales Enablement",
    revenue: 88200,
    marketers: 7,
    commission: 17640,
    growth: "+7%",
    image: "https://ui-avatars.com/api/?name=FP&background=7C3AED&color=fff",
  },
  {
    name: "HealthDash",
    category: "Healthcare",
    revenue: 80100,
    marketers: 10,
    commission: 16020,
    growth: "+15%",
    image: "https://ui-avatars.com/api/?name=HD&background=EF4444&color=fff",
  },
  {
    name: "MetricForge",
    category: "Analytics",
    revenue: 73400,
    marketers: 5,
    commission: 14680,
    growth: "+32%",
    image: "https://ui-avatars.com/api/?name=MF&background=059669&color=fff",
  },
  {
    name: "CodeStream",
    category: "Dev Tools",
    revenue: 60500,
    marketers: 6,
    commission: 12100,
    growth: "+8%",
    image: "https://ui-avatars.com/api/?name=CS&background=6366F1&color=fff",
  },
  {
    name: "LearnEasy",
    category: "Education",
    revenue: 45200,
    marketers: 5,
    commission: 9040,
    growth: "+3%",
    image: "https://ui-avatars.com/api/?name=LE&background=F97316&color=fff",
  },
];

const highlights = [
  {
    title: "Creator-first payouts",
    description:
      "Control when commissions move. Keep cash flow predictable while affiliates stay motivated.",
    icon: ShieldCheck,
  },
  {
    title: "Marketer rankings",
    description:
      "Promote top performers with social proof and live revenue visibility across your network.",
    icon: TrendingUp,
  },
  {
    title: "Global-ready referrals",
    description:
      "Track coupon performance and pay across borders with a clean Stripe Connect trail.",
    icon: Globe2,
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background selection:bg-primary/10">
      <Navbar />
      {/* Vertical Lines Background Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl border-x border-border/40">
        <div className="absolute inset-y-0 left-1/3 w-px bg-border/40" />
        <div className="absolute inset-y-0 right-1/3 w-px bg-border/40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden border-b border-border/40 pb-20 pt-24 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-2xl space-y-8">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Marketplace Intelligence v2.0
                </Badge>
              </div>

              <h1 className="text-5xl font-semibold tracking-tighter sm:text-6xl md:text-7xl">
                Scale with an <br />
                <span className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                  Army of Sellers
                </span>
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
                The first marketplace that connects high-quality SaaS products with expert marketers. Makers build. Marketers sell. Everyone wins.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20 transition-all" asChild>
                  <Link href="/signup">
                    Get started
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="h-12 rounded-full px-8 text-base hover:bg-primary/5" asChild>
                  <Link href="/login">View live demo</Link>
                </Button>
              </div>
            </div>

            {/* Hero Card / Snapshot - stylized like a dashboard widget */}
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl opacity-50" />
              <Card className="relative overflow-hidden border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Weekly Snapshot</CardTitle>
                    <CardDescription>Live revenue metrics</CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">LIVE</Badge>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Creator Payouts</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight">{formatCurrency(38200)}</span>
                        <span className="text-xs font-medium text-emerald-500 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" /> +12%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Marketer Earnings</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight">{formatCurrency(14650)}</span>
                        <span className="text-xs font-medium text-emerald-500 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" /> +8%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-card border border-border/50 p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Top Mover</p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">BuildPublic</span> jumped +22% after a new affiliate bundle launch.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tables Section (Now immediately after Hero) */}
      <section className="relative z-10 border-b border-border/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight">Leaderboard</h2>
            <Button variant="outline" className="gap-2">
              View full report <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Marketers Table */}
            <Card className="overflow-hidden bg-background/50 border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Top Marketers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_120px_120px] gap-4 px-5 py-2 border-b border-border/40 bg-muted/10 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <div>Rank & Details</div>
                  <div className="text-right">Revenue</div>
                  <div className="text-right">Commission</div>
                </div>
                <div className="divide-y divide-border/40">
                  {topMarketers.map((marketer, i) => (
                    <div
                      key={marketer.name}
                      className="group grid grid-cols-[1fr_120px_120px] gap-4 items-center p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-sm font-bold text-muted-foreground shadow-sm">
                          {i < 9 ? `0${i + 1}` : i + 1}
                        </div>
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={marketer.image} alt={marketer.name} />
                          <AvatarFallback>{marketer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{marketer.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{marketer.focus}</span>
                            <span>•</span>
                            <span className="truncate">{marketer.activeProjects} projects</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(marketer.revenue)}</p>
                        <p className="text-xs text-muted-foreground">{marketer.trend}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(marketer.commission)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-muted/10 border-t border-border/40">
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground justify-between group">
                    View all marketers <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            <Card className="overflow-hidden bg-background/50 border-border/50 shadow-sm h-fit">
              <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Top Projects</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-2 border-b border-border/40 bg-muted/10 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <div>Rank & Details</div>
                  <div className="text-right">Revenue & Growth</div>
                </div>
                <div className="divide-y divide-border/40">
                  {topProjects.map((project, i) => (
                    <Link
                      href={`/projects/${project.name.toLowerCase().replace(/\s+/g, '-')}`}
                      key={project.name}
                      className="group flex items-center justify-between p-5 hover:bg-muted/30 transition-colors block"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background text-sm font-bold text-muted-foreground shadow-sm">
                          {i < 9 ? `0${i + 1}` : i + 1}
                        </div>
                        <Avatar className="h-10 w-10 rounded-lg">
                          <AvatarImage src={project.image} alt={project.name} />
                          <AvatarFallback className="rounded-lg">{project.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{project.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {project.marketers}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(project.revenue)}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">{project.growth}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="p-4 bg-muted/10 border-t border-border/40">
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground justify-between group">
                    View all projects <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Public Snapshot - High Level Stats */}
      <section className="relative z-10 border-b border-border/40 bg-muted/10 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted by modern teams
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Total Revenue Shared", value: "$4.2M+" },
              { label: "Active Partners", value: "850+" },
              { label: "Payouts Processed", value: "12k+" },
              { label: "Avg. Commission", value: "22%" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                  {stat.value}
                </h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl text-center mx-auto">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl mb-4">
              Everything you need to <span className="text-primary">scale revenue</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete toolkit for managing partnerships, payouts, and performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. Creator Payout Console (Wide) */}
            <Card className="col-span-1 md:col-span-2 overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Wallet className="h-4 w-4 text-primary" />
                  Creator Payout Console
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  Track what’s owed, ready, and paid with receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-4 pt-0 min-h-0">
                <div className="h-full w-full bg-card border border-border/40 rounded-lg shadow-sm flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-foreground">Processing Batch #4092</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5">4 Items</Badge>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-hidden">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">LF</div>
                          <div className="space-y-0.5">
                            <div className="h-2 w-16 bg-muted/60 rounded" />
                            <div className="h-1.5 w-10 bg-muted/40 rounded" />
                          </div>
                        </div>
                        <div className="text-xs font-mono font-medium">$420.00</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Contracting */}
            <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <FileSignature className="h-4 w-4 text-orange-500" />
                  Contracting
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  Approve contracts and set commissions.
                </CardDescription>
              </CardHeader>
              <div className="flex-1 p-4 min-h-0 flex flex-col justify-end">
                <div className="relative w-full h-32 bg-muted/10 rounded-lg border border-border/40 overflow-hidden">
                  <div className="absolute top-3 left-3 w-16 h-2 bg-muted/40 rounded" />
                  <div className="absolute top-7 left-3 right-3 space-y-1.5">
                    <div className="h-1.5 w-full bg-muted/20 rounded" />
                    <div className="h-1.5 w-4/5 bg-muted/20 rounded" />
                    <div className="h-1.5 w-full bg-muted/20 rounded" />
                  </div>
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <div className="h-6 w-16 bg-orange-500/10 rounded border border-orange-500/20 flex items-center justify-center text-[10px] text-orange-500 font-medium">Sign</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Connect */}
            <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <PlugZap className="h-4 w-4 text-purple-500" />
                  Stripe Connect
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  Guided onboarding for all partners.
                </CardDescription>
              </CardHeader>
              <div className="flex-1 p-4 min-h-0 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent" />
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Zap className="h-10 w-10 text-white fill-white" />
                </div>
              </div>
            </Card>

            {/* 4. Smart Coupons */}
            <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Ticket className="h-4 w-4 text-pink-500" />
                  Smart Coupons
                </CardTitle>
                <CardDescription>
                  Unique codes & real attribution.
                </CardDescription>
              </CardHeader>
              <div className="flex-1 p-4 min-h-0 flex items-end">
                <div className="w-full border-2 border-dashed border-pink-500/30 bg-pink-500/5 rounded-lg p-3 flex flex-col items-center justify-center gap-1 group-hover:border-pink-500/50 transition-colors">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Code</span>
                  <span className="font-mono text-lg font-bold text-pink-500 tracking-wider">BMK20</span>
                </div>
              </div>
            </Card>

            {/* 5. Public Dashboard */}
            <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <LineChart className="h-4 w-4 text-blue-500" />
                  Public Dashboard
                </CardTitle>
                <CardDescription>
                  Showcase best performers.
                </CardDescription>
              </CardHeader>
              <div className="flex-1 px-6 pb-6 pt-2 flex items-end min-h-0">
                <div className="flex items-end gap-1.5 h-full w-full max-h-[120px]">
                  {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-blue-500/20 rounded-t-sm group-hover:bg-blue-500/40 transition-colors" />
                  ))}
                </div>
              </div>
            </Card>

            {/* 6. Revenue & Earnings (Merged) */}
            <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <PieChart className="h-4 w-4 text-green-500" />
                  Revenue & Earnings
                </CardTitle>
                <CardDescription>
                  Live maker & marketer stats.
                </CardDescription>
              </CardHeader>
              <div className="flex-1 p-4 pt-2 flex flex-col gap-3 min-h-0 justify-end">
                <div className="rounded-md bg-muted/20 p-2.5 border border-border/40">
                  <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Platform Sales</div>
                  <div className="text-lg font-bold text-foreground">$124,500</div>
                </div>
                <div className="rounded-md bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-600/80 uppercase mb-0.5">My Earnings</div>
                  <div className="text-lg font-bold text-emerald-500">$2,840.00</div>
                </div>
              </div>
            </Card>

            {/* 7. Auto Ledger */}
            <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-colors h-[280px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <ReceiptText className="h-4 w-4 text-gray-500" />
                  Auto Ledger
                </CardTitle>
                <CardDescription>
                  Automated audit trail.
                </CardDescription>
              </CardHeader>
              <div className="flex-1 p-4 pt-2 space-y-3 min-h-0 overflow-hidden flex flex-col justify-end">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-zinc-700 shrink-0 mt-1" />
                    <div className="h-2 w-full bg-zinc-800/50 rounded-full" />
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* How It Works - 3 Step Flow */}
      <section className="relative z-10 border-y border-border/40 bg-muted/5 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your partnership engine in three simple steps.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Makers List Products",
                desc: "Connect your Stripe account and set your commission rules (e.g. 20% on first 3 months).",
                icon: Layers,
              },
              {
                step: "02",
                title: "Marketers Apply",
                desc: "Verified experts request to promote your tool. You review their profile and approve.",
                icon: Users,
              },
              {
                step: "03",
                title: "Revenue Flows",
                desc: "Sales are tracked automatically. Commissions are split instantly at the point of sale.",
                icon: Zap,
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <div className="group rounded-2xl border border-border/60 bg-background p-8 hover:border-border/80 transition-colors">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="mb-2 font-mono text-sm font-semibold text-primary/50">
                    STEP {item.step}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-10 text-muted-foreground/30">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Trust & Safety</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Enterprise-grade security without the enterprise friction.
              </h2>
              <p className="text-lg text-muted-foreground">
                We built RevShare on top of Stripe Connect to ensure money flows directly between verified parties. We never hold your funds.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Stripe Connect integration for direct payouts",
                  "Full audit logs for every click and conversion",
                  "Identity verification for all marketers",
                  "Dispute resolution & refund handling logic"
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-primary/20 via-blue-500/10 to-purple-500/20 blur-2xl opacity-70" />
              <div className="relative rounded-2xl border border-border/60 bg-background/50 backdrop-blur-xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-border/40 pb-6">
                    <div className="h-10 w-10 bg-[#635BFF] rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <div>
                      <p className="font-semibold">Stripe Verified Partner</p>
                      <p className="text-xs text-muted-foreground">Payment infrastructure</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-muted/20 rounded-lg">
                      <span className="text-muted-foreground">Compliance</span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> SOC2 Ready
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-muted/20 rounded-lg">
                      <span className="text-muted-foreground">Encryption</span>
                      <span className="text-foreground font-medium">AES-256</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Logos */}
      <section className="relative z-10 border-t border-border/40 bg-muted/5 py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight">Joined by fast-growing teams</h2>
        </div>
        <div className="relative flex w-full overflow-hidden">
          {/* Logo Marquee */}
          <div className="flex w-full animate-in fade-in zoom-in duration-1000 justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all">
            {/* Placeholder Logos represented by text for now, in a real app these would be SVGs */}
            {['Acme Corp', 'Waave', 'Catalog', 'Sisyphus', 'Quotient', 'Layers'].map(brand => (
              <div key={brand} className="text-xl font-bold tracking-tight text-foreground/40 hover:text-foreground/80 cursor-default">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-3xl bg-gradient-to-tr from-muted/50 via-background to-muted/50 p-1 border border-border/40">
            <div className="rounded-[1.4rem] bg-background p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Ready to scale your <span className="text-primary italic">partnerships?</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join the network where top creators and elite marketers build wealth together.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/10" asChild>
                  <Link href="/signup">
                    Create workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
