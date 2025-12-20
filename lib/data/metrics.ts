import {
  AnalyticsEvent,
  Project,
  Offer,
  MarketerProjectMetrics,
  CreatorMetrics,
  ProjectMetrics,
} from "./types";

const PLATFORM_FEE_PERCENT = 5; // 5% platform fee

// Get metrics for a specific marketer-project pair
export function getMarketerProjectMetrics(
  events: AnalyticsEvent[],
  project: Project,
  marketerId: string
): MarketerProjectMetrics {
  const relevantEvents = events.filter(
    (e) => e.projectId === project.id && e.marketerId === marketerId
  );

  const clicks = relevantEvents.filter((e) => e.type === "click").length;
  const signups = relevantEvents.filter((e) => e.type === "signup").length;

  // Unique customers with paid subscriptions
  const paidCustomerIds = new Set(
    relevantEvents
      .filter((e) => e.type === "paid_subscription" && e.customerId)
      .map((e) => e.customerId)
  );
  const paidCustomers = paidCustomerIds.size;

  // Calculate MRR (sum of recurring subscription amounts from past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRecurring = relevantEvents.filter(
    (e) =>
      e.type === "paid_subscription" &&
      e.isRecurring &&
      new Date(e.createdAt) >= thirtyDaysAgo
  );

  // Get unique customers with recurring payments in last 30 days
  const activeRecurringCustomers = new Set(
    recentRecurring.map((e) => e.customerId)
  );

  // MRR = number of active recurring customers * subscription price
  const mrr = activeRecurringCustomers.size * project.price;

  // Conversion rate
  const conversionRate = clicks > 0 ? (signups / clicks) * 100 : 0;

  // Calculate earnings
  const totalRevenue = relevantEvents
    .filter((e) => e.type === "paid_subscription")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalRefunds = relevantEvents
    .filter((e) => e.type === "refund")
    .reduce((sum, e) => sum + e.amount, 0);

  const netRevenue = totalRevenue - totalRefunds;
  const earnings = Math.floor((netRevenue * project.revSharePercent) / 100);

  return {
    clicks,
    signups,
    paidCustomers,
    mrr,
    conversionRate: Math.round(conversionRate * 100) / 100,
    earnings,
  };
}

// Get all metrics for a marketer across all their approved offers
export function getMarketerTotalMetrics(
  events: AnalyticsEvent[],
  projects: Project[],
  offers: Offer[],
  marketerId: string
): {
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  totalMrr: number;
  totalEarnings: number;
  upcomingEarnings: number;
} {
  const approvedOffers = offers.filter(
    (o) => o.marketerId === marketerId && o.status === "approved"
  );

  let totalClicks = 0;
  let totalSignups = 0;
  let totalConversions = 0;
  let totalMrr = 0;
  let totalEarnings = 0;

  approvedOffers.forEach((offer) => {
    const project = projects.find((p) => p.id === offer.projectId);
    if (!project) return;

    const metrics = getMarketerProjectMetrics(events, project, marketerId);
    totalClicks += metrics.clicks;
    totalSignups += metrics.signups;
    totalConversions += metrics.paidCustomers;
    totalMrr += metrics.mrr;
    totalEarnings += metrics.earnings;
  });

  // Upcoming earnings (estimate based on MRR)
  const upcomingEarnings = Math.floor(totalMrr * 0.25); // Rough average rev share

  return {
    totalClicks,
    totalSignups,
    totalConversions,
    totalMrr,
    totalEarnings,
    upcomingEarnings,
  };
}

// Get metrics for a specific project
export function getProjectMetrics(
  events: AnalyticsEvent[],
  project: Project
): ProjectMetrics {
  const projectEvents = events.filter((e) => e.projectId === project.id);

  const totalRevenue = projectEvents
    .filter((e) => e.type === "paid_subscription")
    .reduce((sum, e) => sum + e.amount, 0);

  const refunds = projectEvents
    .filter((e) => e.type === "refund")
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate MRR (active subscribers in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeCustomerIds = new Set(
    projectEvents
      .filter(
        (e) =>
          e.type === "paid_subscription" &&
          e.isRecurring &&
          new Date(e.createdAt) >= thirtyDaysAgo &&
          e.customerId
      )
      .map((e) => e.customerId)
  );

  // Subtract churned customers
  const churnedCustomerIds = new Set(
    projectEvents
      .filter((e) => e.type === "churn" && e.customerId)
      .map((e) => e.customerId)
  );

  const activeSubscribers = [...activeCustomerIds].filter(
    (id) => !churnedCustomerIds.has(id)
  ).length;

  const mrr = activeSubscribers * project.price;

  // Affiliate attributed revenue
  const affiliateRevenue = projectEvents
    .filter((e) => e.type === "paid_subscription" && e.marketerId !== null)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    totalRevenue: totalRevenue - refunds,
    mrr,
    affiliateRevenue,
    activeSubscribers,
  };
}

// Get creator-level metrics across all their projects
export function getCreatorMetrics(
  events: AnalyticsEvent[],
  projects: Project[],
  creatorId: string
): CreatorMetrics {
  const creatorProjects = projects.filter((p) => p.creatorId === creatorId);

  let totalRevenue = 0;
  let totalMrr = 0;
  let affiliateRevenue = 0;
  let affiliateShareOwed = 0;

  creatorProjects.forEach((project) => {
    const projectMetrics = getProjectMetrics(events, project);
    totalRevenue += projectMetrics.totalRevenue;
    totalMrr += projectMetrics.mrr;
    affiliateRevenue += projectMetrics.affiliateRevenue;

    // Calculate commission owed for this project
    const projectAffiliateShare = Math.floor(
      (projectMetrics.affiliateRevenue * project.revSharePercent) / 100
    );
    affiliateShareOwed += projectAffiliateShare;
  });

  const platformFee = Math.floor(
    (affiliateShareOwed * PLATFORM_FEE_PERCENT) / 100
  );

  return {
    totalRevenue,
    mrr: totalMrr,
    affiliateRevenue,
    affiliateShareOwed,
    platformFee,
  };
}

// Get marketer metrics for a specific project (for creator's project detail view)
export function getProjectMarketerMetrics(
  events: AnalyticsEvent[],
  project: Project,
  offers: Offer[]
): Array<{
  marketerId: string;
  metrics: MarketerProjectMetrics;
}> {
  const projectOffers = offers.filter(
    (o) => o.projectId === project.id && o.status === "approved"
  );

  return projectOffers.map((offer) => ({
    marketerId: offer.marketerId,
    metrics: getMarketerProjectMetrics(events, project, offer.marketerId),
  }));
}

// Get revenue timeline data for charts
export function getRevenueTimeline(
  events: AnalyticsEvent[],
  projectId?: string,
  marketerId?: string,
  days: number = 30
): Array<{ date: string; revenue: number; affiliateRevenue: number }> {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Filter events
  let filteredEvents = events.filter((e) => e.type === "paid_subscription");

  if (projectId) {
    filteredEvents = filteredEvents.filter((e) => e.projectId === projectId);
  }

  // Group by day
  const dailyData: Record<string, { revenue: number; affiliateRevenue: number }> = {};

  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split("T")[0];
    dailyData[dateKey] = { revenue: 0, affiliateRevenue: 0 };
  }

  filteredEvents.forEach((event) => {
    const eventDate = new Date(event.createdAt);
    if (eventDate >= startDate && eventDate <= now) {
      const dateKey = eventDate.toISOString().split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].revenue += event.amount;
        if (event.marketerId) {
          if (marketerId === undefined || event.marketerId === marketerId) {
            dailyData[dateKey].affiliateRevenue += event.amount;
          }
        }
      }
    }
  });

  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      revenue: data.revenue / 100, // Convert to dollars for display
      affiliateRevenue: data.affiliateRevenue / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Format currency for display
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Format large numbers with K/M suffixes
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// Format percentage
export function formatPercent(value: number): string {
  return value.toFixed(1) + "%";
}
