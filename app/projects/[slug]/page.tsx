"use client";

import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/data/metrics";
import {
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Globe,
    LineChart,
    ShieldCheck,
    TrendingUp,
    Users,
    Zap,
    Building2,
    Calendar,
    Wallet
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { use, useState } from "react";
import Link from "next/link";

// Mock Data for the chart
const revenueData = [
    { month: "Jan", revenue: 45000, commission: 9000 },
    { month: "Feb", revenue: 52000, commission: 10400 },
    { month: "Mar", revenue: 49000, commission: 9800 },
    { month: "Apr", revenue: 63000, commission: 12600 },
    { month: "May", revenue: 75000, commission: 15000 },
    { month: "Jun", revenue: 82000, commission: 16400 },
    { month: "Jul", revenue: 88000, commission: 17600 },
    { month: "Aug", revenue: 95000, commission: 19000 },
    { month: "Sep", revenue: 110000, commission: 22000 },
    { month: "Oct", revenue: 121000, commission: 24200 },
    { month: "Nov", revenue: 135000, commission: 27000 },
    { month: "Dec", revenue: 150000, commission: 30000 },
];

export default function ProjectProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    // In a real app, we would fetch data based on the slug
    const { slug } = use(params);

    // Mock project data typically fetched from DB
    const project = {
        name: "SocialPulse",
        slug: "socialpulse",
        tagline: "The all-in-one social media management platform for teams.",
        description: "SocialPulse helps brands and agencies grow their social presence with advanced analytics, scheduling, and collaboration tools. We're looking for expert marketers to help us reach B2B teams and agencies scaling their social ops.",
        category: "Social Media",
        website: "socialpulse.io",
        founded: "2022",
        stats: {
            mrr: 150000,
            growth: "+20%",
            partners: 12,
            avgCommission: "$2,500",
            conversionRate: "4.8%"
        },
        commission: {
            rate: "20%",
            term: "Lifetime",
            cookie: "90 days"
        },
        image: "https://ui-avatars.com/api/?name=SP&background=EC4899&color=fff",
        features: [
            "Recurring revenue share",
            "High converting landing pages",
            "Dedicated partner manager",
            "Real-time attribution"
        ]
    };

    return (
        <main className="min-h-screen bg-background selection:bg-primary/10">
            <Navbar />
            {/* Vertical Lines Background Pattern */}
            <div className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl border-x border-border/40">
                <div className="absolute inset-y-0 left-[65.5%] w-px bg-border/40 hidden lg:block" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
            </div>

            {/* Header / Hero Section */}
            <div className="relative border-b border-border/40 bg-muted/5 pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] pointer-events-none" />

                <div className="mx-auto max-w-7xl px-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        <div className="flex gap-6 items-center">
                            <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl shadow-sm">
                                <AvatarImage src={project.image} alt={project.name} />
                                <AvatarFallback className="rounded-2xl text-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">SP</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{project.name}</h1>
                                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-500/10 gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </Badge>
                                </div>
                                <p className="text-lg text-muted-foreground max-w-2xl">
                                    {project.tagline}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4" />
                                        {project.category}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Globe className="h-4 w-4" />
                                        {project.website}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        Founded {project.founded}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                            <Button size="lg" className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-semibold text-base">
                                Apply to Promote
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Usually responds in 24h
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">

                    {/* Left Column: Main Content */}
                    <div className="space-y-10">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Card className="bg-muted/10 border-border/40 shadow-none">
                                <CardContent className="p-4 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Current MRR</p>
                                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(project.stats.mrr)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/10 border-border/40 shadow-none">
                                <CardContent className="p-4 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">MoM Growth</p>
                                    <p className="text-2xl font-bold tracking-tight text-emerald-500">{project.stats.growth}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/10 border-border/40 shadow-none">
                                <CardContent className="p-4 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Active Partners</p>
                                    <p className="text-2xl font-bold tracking-tight">{project.stats.partners}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                                <CardContent className="p-4 space-y-1 relative">
                                    <p className="text-xs font-medium text-emerald-600/80 uppercase">Avg. Commission</p>
                                    <p className="text-2xl font-bold tracking-tight text-emerald-600">{project.stats.avgCommission}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Revenue Chart */}
                        <Card className="border-border/50 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <LineChart className="h-4 w-4 text-primary" />
                                    Revenue Growth Trajectory
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full pt-0 pl-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            tickFormatter={(value) => `$${value / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '0.5rem',
                                                fontSize: '12px'
                                            }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Website Preview */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Product Preview</h3>
                            <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden shadow-sm group">
                                <div className="h-8 bg-muted/40 border-b border-border/40 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                                    </div>
                                    <div className="mx-auto bg-background/50 h-5 w-64 rounded text-[10px] flex items-center justify-center text-muted-foreground font-mono">
                                        socialpulse.io
                                    </div>
                                </div>
                                {/* Placeholder for actual screenshot */}
                                <div className="aspect-video bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 flex items-center justify-center relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 font-bold text-4xl select-none">
                                        App Interface
                                    </div>
                                    {/* Abstract UI representation */}
                                    <div className="w-3/4 h-3/4 bg-background rounded-lg shadow-2xl border border-border/20 p-6 space-y-4 opacity-80 group-hover:scale-[1.02] transition-transform duration-500">
                                        <div className="flex gap-4">
                                            <div className="w-1/4 h-32 bg-muted/30 rounded" />
                                            <div className="w-3/4 space-y-3">
                                                <div className="w-full h-8 bg-muted/30 rounded" />
                                                <div className="w-full h-24 bg-muted/30 rounded" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 h-24">
                                            <div className="bg-muted/30 rounded" />
                                            <div className="bg-muted/30 rounded" />
                                            <div className="bg-muted/30 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">About the Project</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {project.description}
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                We are looking for partners who understand the Creator Economy and B2B SaaS space. Our ideal customer profile includes marketing agencies, social media managers, and growth teams at mid-sized tech companies.
                            </p>
                        </div>

                    </div>

                    {/* Right Column: Key Details & Sticky Sidebar */}
                    <div className="space-y-8">
                        <Card className="border-border/50 sticky top-24">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Partnership Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                        <span className="text-sm text-muted-foreground">Commission</span>
                                        <span className="font-bold text-emerald-600 text-lg">{project.commission.rate}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                        <span className="text-sm text-muted-foreground">Cookie Life</span>
                                        <span className="font-medium">{project.commission.cookie}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                        <span className="text-sm text-muted-foreground">Duration</span>
                                        <span className="font-medium">{project.commission.term}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Benefits</h4>
                                    <ul className="space-y-2">
                                        {project.features.map(feature => (
                                            <li key={feature} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button className="w-full h-11 rounded-xl shadow-md" size="lg">
                                    Apply Now
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-xl">
                            <div className="flex items-start gap-3 mb-4">
                                <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                                <h3 className="font-bold text-lg">Pro Tip</h3>
                            </div>
                            <p className="text-sm text-white/90 leading-relaxed mb-4">
                                Top performing marketers for this project often bundle SocialPulse with content strategy courses.
                            </p>
                            <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                                View Resources
                            </Button>
                        </div>

                    </div>

                </div>
            </div>
        </main>
    );
}
