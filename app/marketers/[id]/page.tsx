import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Globe,
  LineChart,
  MapPin,
  PieChart,
  ShieldCheck,
  ShoppingBag,
  Star,
  Target,
  TrendingUp,
  Twitter,
  Wallet
} from "lucide-react";
import Link from "next/link";

// Dummy data for the marketer profile
const marketerData = {
  id: "marketer-1",
  name: "Lara Finch",
  email: "lara@example.com",
  bio: "B2B SaaS marketing expert with 8+ years of experience scaling revenue for high-growth startups. Specialized in content marketing, community building, and strategic partnerships. I've helped 50+ SaaS companies achieve 3x growth through targeted affiliate programs.",
  location: "San Francisco, CA",
  joinedDate: "2022-03-15",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lara",
  website: "https://larafinch.com",
  twitter: "@larafinch",
  linkedin: "larafinch",
  verified: true,
  badges: ["Top Performer", "Verified Partner", "Elite Marketer"],
  focus: "B2B SaaS",
  specialties: [
    "Content Marketing",
    "Community Building",
    "Strategic Partnerships",
    "Growth Hacking",
  ],
};

const stats = {
  totalEarnings: 169000,
  totalRevenue: 845000,
  activeProjects: 6,
  totalSales: 1247,
  conversionRate: 4.8,
  avgCommission: 20,
  growth: "+12%",
  rank: 1,
};

const earningsTimeline = [
  { month: "Jan", earnings: 12500, revenue: 62500 },
  { month: "Feb", earnings: 14200, revenue: 71000 },
  { month: "Mar", earnings: 15800, revenue: 79000 },
  { month: "Apr", earnings: 17200, revenue: 86000 },
  { month: "May", earnings: 18900, revenue: 94500 },
  { month: "Jun", earnings: 20100, revenue: 100500 },
  { month: "Jul", earnings: 18500, revenue: 92500 },
  { month: "Aug", earnings: 19800, revenue: 99000 },
  { month: "Sep", earnings: 21500, revenue: 107500 },
  { month: "Oct", earnings: 22800, revenue: 114000 },
  { month: "Nov", earnings: 24100, revenue: 120500 },
  { month: "Dec", earnings: 25400, revenue: 127000 },
];

const projects = [
  {
    id: "proj-1",
    name: "SocialPulse",
    category: "Social Media",
    logoUrl: "https://ui-avatars.com/api/?name=SP&background=EC4899&color=fff",
    revenue: 245000,
    earnings: 49000,
    sales: 342,
    commission: 20,
    status: "active",
    joinedDate: "2023-01-15",
  },
  {
    id: "proj-2",
    name: "CryptoTracker",
    category: "Web3",
    logoUrl: "https://ui-avatars.com/api/?name=CT&background=F59E0B&color=fff",
    revenue: 198000,
    earnings: 39600,
    sales: 287,
    commission: 20,
    status: "active",
    joinedDate: "2023-02-20",
  },
  {
    id: "proj-3",
    name: "BuildPublic",
    category: "Creator Tools",
    logoUrl: "https://ui-avatars.com/api/?name=BP&background=2563EB&color=fff",
    revenue: 156000,
    earnings: 31200,
    sales: 198,
    commission: 20,
    status: "active",
    joinedDate: "2023-03-10",
  },
  {
    id: "proj-4",
    name: "Designify",
    category: "Design Tools",
    logoUrl: "https://ui-avatars.com/api/?name=DS&background=8B5CF6&color=fff",
    revenue: 134000,
    earnings: 26800,
    sales: 167,
    commission: 20,
    status: "active",
    joinedDate: "2023-04-05",
  },
  {
    id: "proj-5",
    name: "TaskMaster",
    category: "Productivity",
    logoUrl: "https://ui-avatars.com/api/?name=TM&background=10B981&color=fff",
    revenue: 89000,
    earnings: 17800,
    sales: 156,
    commission: 20,
    status: "active",
    joinedDate: "2023-05-12",
  },
  {
    id: "proj-6",
    name: "Flowdesk Pro",
    category: "Sales Enablement",
    logoUrl: "https://ui-avatars.com/api/?name=FP&background=7C3AED&color=fff",
    revenue: 34000,
    earnings: 6800,
    sales: 97,
    commission: 20,
    status: "active",
    joinedDate: "2023-06-18",
  },
];

const recentCommissions = [
  {
    id: "comm-1",
    project: "SocialPulse",
    amount: 4200,
    date: "2024-01-15",
    status: "paid",
    sales: 21,
  },
  {
    id: "comm-2",
    project: "CryptoTracker",
    amount: 3800,
    date: "2024-01-14",
    status: "paid",
    sales: 19,
  },
  {
    id: "comm-3",
    project: "BuildPublic",
    amount: 3100,
    date: "2024-01-13",
    status: "pending",
    sales: 15,
  },
  {
    id: "comm-4",
    project: "Designify",
    amount: 2680,
    date: "2024-01-12",
    status: "paid",
    sales: 13,
  },
  {
    id: "comm-5",
    project: "TaskMaster",
    amount: 1780,
    date: "2024-01-11",
    status: "paid",
    sales: 9,
  },
];

const performanceMetrics = [
  {
    label: "Click-Through Rate",
    value: "8.2%",
    trend: "+2.1%",
    color: "text-blue-500",
  },
  {
    label: "Conversion Rate",
    value: "4.8%",
    trend: "+0.5%",
    color: "text-emerald-500",
  },
  {
    label: "Avg. Order Value",
    value: "$678",
    trend: "+$45",
    color: "text-purple-500",
  },
  {
    label: "Customer Lifetime Value",
    value: "$2,450",
    trend: "+$320",
    color: "text-orange-500",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMaxValue(
  data: typeof earningsTimeline,
  key: "earnings" | "revenue"
): number {
  return Math.max(...data.map((d) => d[key]));
}

export default function MarketerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In a real app, we'd fetch data based on params.id
  // For now, using dummy data

  const maxEarnings = getMaxValue(earningsTimeline, "earnings");
  const maxRevenue = getMaxValue(earningsTimeline, "revenue");

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
              <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl shadow-sm border-2 border-primary/20">
                <AvatarImage
                  src={marketerData.avatar}
                  alt={marketerData.name}
                />
                <AvatarFallback className="rounded-2xl text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  {getInitials(marketerData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {marketerData.name}
                  </h1>
                  {marketerData.verified && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 text-emerald-600 bg-emerald-500/10 gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary bg-primary/10"
                  >
                    #{stats.rank} Marketer
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {marketerData.bio}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {marketerData.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(marketerData.joinedDate)}
                  </div>
                  {marketerData.website && (
                    <a
                      href={marketerData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {marketerData.twitter && (
                    <a
                      href={`https://twitter.com/${marketerData.twitter.replace(
                        "@",
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      {marketerData.twitter}
                    </a>
                  )}
                </div>
                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {marketerData.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-semibold text-base"
              >
                Partner with {marketerData.name.split(" ")[0]}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Available for new partnerships
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="border-border/50 bg-background/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {stats.growth} this month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Revenue Generated
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    For partner projects
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Active Projects
                  </p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    All active
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Conversion Rate
                  </p>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalSales} total sales
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
          {/* Left Column: Main Content */}
          <div className="space-y-10">
            {/* Earnings & Revenue Chart */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Earnings & Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly performance over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Chart */}
                  <div className="relative h-64">
                    {/* Earnings bars */}
                    <div className="absolute inset-0 flex items-end justify-between gap-1">
                      {earningsTimeline.map((item, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1 group"
                        >
                          <div
                            className="w-full bg-emerald-500/20 rounded-t hover:bg-emerald-500/30 transition-colors relative group-hover:bg-emerald-500/40"
                            style={{
                              height: `${(item.earnings / maxEarnings) * 100}%`,
                            }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs font-medium whitespace-nowrap">
                              {formatCurrency(item.earnings)}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Revenue line overlay */}
                    <div className="absolute inset-0 flex items-end justify-between">
                      {earningsTimeline.map((item, i) => (
                        <div
                          key={i}
                          className="flex-1 flex items-end justify-center"
                          style={{
                            height: `${(item.revenue / maxRevenue) * 100}%`,
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-0.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-emerald-500/20" />
                      <span className="text-muted-foreground">Earnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">
                        Revenue Generated
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Project Chart */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Revenue by Project
                </CardTitle>
                <CardDescription>
                  Distribution of revenue across active partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => {
                    const percentage =
                      (project.revenue / stats.totalRevenue) * 100;
                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage
                                src={project.logoUrl}
                                alt={project.name}
                              />
                              <AvatarFallback className="rounded-lg text-xs">
                                {project.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {project.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(project.revenue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Active Partnerships
              </h3>
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group"
                  >
                    <Card className="border-border/50 bg-background/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12 rounded-xl">
                              <AvatarImage
                                src={project.logoUrl}
                                alt={project.name}
                              />
                              <AvatarFallback className="rounded-xl">
                                {project.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold group-hover:text-primary transition-colors">
                                  {project.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {project.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  {formatCurrency(project.revenue)} generated
                                </span>
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3.5 w-3.5" />
                                  {formatCurrency(project.earnings)} earned
                                </span>
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  {project.sales} sales
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              {project.commission}% commission
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Since {formatDate(project.joinedDate)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="p-4 rounded-lg border border-border/40 bg-muted/20"
                    >
                      <p className="text-sm text-muted-foreground mb-1">
                        {metric.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold ${metric.color}`}>
                          {metric.value}
                        </p>
                        <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <Card className="border-border/50 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Focus Area
                    </span>
                    <span className="font-semibold">{marketerData.focus}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Avg. Commission
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {stats.avgCommission}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Total Sales
                    </span>
                    <span className="font-semibold">
                      {stats.totalSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Platform Rank
                    </span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      #{stats.rank}
                    </Badge>
                  </div>
                </div>

                {/* Specialties */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {marketerData.specialties.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant="secondary"
                        className="text-xs bg-muted"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full h-11 rounded-xl shadow-md" size="lg">
                  Partner with {marketerData.name.split(" ")[0]}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Commissions */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="text-base">Recent Commissions</CardTitle>
                <CardDescription>Latest earnings activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCommissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {commission.project}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {commission.sales} sales •{" "}
                          {new Date(commission.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">
                          {formatCurrency(commission.amount)}
                        </p>
                        <Badge
                          variant={
                            commission.status === "paid"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] mt-1"
                        >
                          {commission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" size="sm">
                  View all commissions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Testimonials */}
            <Card className="border-border/50 bg-background/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Testimonials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      "Lara has been instrumental in scaling our affiliate
                      program. Her strategic approach and deep understanding of
                      B2B SaaS marketing has driven significant revenue growth."
                    </p>
                    <p className="text-xs font-medium">— CEO, SocialPulse</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      "Outstanding partner. Professional, results-driven, and
                      always delivers on commitments. Highly recommend!"
                    </p>
                    <p className="text-xs font-medium">
                      — Founder, BuildPublic
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
