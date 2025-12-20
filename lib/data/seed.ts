import {
  User,
  Project,
  Offer,
  AnalyticsEvent,
  EventType,
} from "./types";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper to get random date in past months
const randomPastDate = (monthsAgo: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.random() * monthsAgo);
  return date;
};

// Helper to get date within last N days
const randomRecentDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

// ============ USERS ============
export const users: User[] = [
  {
    id: "creator-1",
    role: "creator",
    name: "Sarah Chen",
    email: "sarah@saasbuilder.io",
    avatarUrl: "",
    stripeConnected: true,
  },
  {
    id: "creator-2",
    role: "creator",
    name: "Marcus Johnson",
    email: "marcus@devtools.co",
    avatarUrl: "",
    stripeConnected: true,
  },
  {
    id: "marketer-1",
    role: "marketer",
    name: "Alex Rivera",
    email: "alex@affiliatepro.com",
    avatarUrl: "",
  },
  {
    id: "marketer-2",
    role: "marketer",
    name: "Jordan Lee",
    email: "jordan@growthagency.io",
    avatarUrl: "",
  },
  {
    id: "marketer-3",
    role: "marketer",
    name: "Taylor Morgan",
    email: "taylor@contentmarketer.co",
    avatarUrl: "",
  },
];

// ============ PROJECTS ============
export const projects: Project[] = [
  {
    id: "proj-1",
    creatorId: "creator-1",
    name: "FormFlow Pro",
    description:
      "Drag-and-drop form builder with advanced logic, integrations, and analytics. Build beautiful forms in minutes.",
    category: "Productivity",
    pricingModel: "subscription",
    price: 2900, // $29/mo
    publicMetrics: {
      mrr: 4520000, // $45,200
      activeSubscribers: 1560,
    },
    revSharePercent: 25,
    cookieWindowDays: 60,
    createdAt: randomPastDate(8),
  },
  {
    id: "proj-2",
    creatorId: "creator-1",
    name: "DataSync",
    description:
      "Real-time data synchronization tool for teams. Sync spreadsheets, databases, and APIs seamlessly.",
    category: "Data",
    pricingModel: "subscription",
    price: 4900, // $49/mo
    publicMetrics: {
      mrr: 2890000, // $28,900
      activeSubscribers: 590,
    },
    revSharePercent: 20,
    cookieWindowDays: 45,
    createdAt: randomPastDate(6),
  },
  {
    id: "proj-3",
    creatorId: "creator-2",
    name: "CodeReview AI",
    description:
      "AI-powered code review assistant. Get instant feedback on code quality, security, and best practices.",
    category: "Developer Tools",
    pricingModel: "subscription",
    price: 1900, // $19/mo
    publicMetrics: {
      mrr: 8750000, // $87,500
      activeSubscribers: 4605,
    },
    revSharePercent: 30,
    cookieWindowDays: 30,
    createdAt: randomPastDate(12),
  },
  {
    id: "proj-4",
    creatorId: "creator-2",
    name: "APIWizard",
    description:
      "Generate beautiful API documentation automatically from your OpenAPI specs with custom themes.",
    category: "Developer Tools",
    pricingModel: "one-time",
    price: 9900, // $99 one-time
    publicMetrics: {
      mrr: 0,
      activeSubscribers: 0,
    },
    revSharePercent: 35,
    cookieWindowDays: 90,
    createdAt: randomPastDate(4),
  },
  {
    id: "proj-5",
    creatorId: "creator-1",
    name: "ScheduleMaster",
    description:
      "Smart scheduling assistant with calendar sync, team availability, and automatic timezone handling.",
    category: "Productivity",
    pricingModel: "subscription",
    price: 1500, // $15/mo
    publicMetrics: {
      mrr: 1250000, // $12,500
      activeSubscribers: 833,
    },
    revSharePercent: 22,
    cookieWindowDays: 30,
    createdAt: randomPastDate(10),
  },
];

// ============ OFFERS ============
export const offers: Offer[] = [
  // Alex Rivera's offers
  {
    id: "offer-1",
    projectId: "proj-1",
    creatorId: "creator-1",
    marketerId: "marketer-1",
    status: "approved",
    referralCode: "ALEX25",
    referralLink: "https://formflowpro.io/?ref=alex25",
    createdAt: randomPastDate(5),
    updatedAt: randomPastDate(5),
  },
  {
    id: "offer-2",
    projectId: "proj-3",
    creatorId: "creator-2",
    marketerId: "marketer-1",
    status: "approved",
    referralCode: "ALEXCODE",
    referralLink: "https://codereview.ai/?ref=alexcode",
    createdAt: randomPastDate(4),
    updatedAt: randomPastDate(4),
  },
  // Jordan Lee's offers
  {
    id: "offer-3",
    projectId: "proj-1",
    creatorId: "creator-1",
    marketerId: "marketer-2",
    status: "approved",
    referralCode: "JORDAN25",
    referralLink: "https://formflowpro.io/?ref=jordan25",
    createdAt: randomPastDate(3),
    updatedAt: randomPastDate(3),
  },
  {
    id: "offer-4",
    projectId: "proj-2",
    creatorId: "creator-1",
    marketerId: "marketer-2",
    status: "approved",
    referralCode: "JORDANSYNC",
    referralLink: "https://datasync.io/?ref=jordansync",
    createdAt: randomPastDate(2),
    updatedAt: randomPastDate(2),
  },
  {
    id: "offer-5",
    projectId: "proj-5",
    creatorId: "creator-1",
    marketerId: "marketer-2",
    status: "pending",
    referralCode: "JORDANSCH",
    referralLink: "https://schedulemaster.io/?ref=jordansch",
    createdAt: randomRecentDate(5),
    updatedAt: randomRecentDate(5),
  },
  // Taylor Morgan's offers
  {
    id: "offer-6",
    projectId: "proj-3",
    creatorId: "creator-2",
    marketerId: "marketer-3",
    status: "approved",
    referralCode: "TAYLORCODE",
    referralLink: "https://codereview.ai/?ref=taylorcode",
    createdAt: randomPastDate(6),
    updatedAt: randomPastDate(6),
  },
  {
    id: "offer-7",
    projectId: "proj-4",
    creatorId: "creator-2",
    marketerId: "marketer-3",
    status: "approved",
    referralCode: "TAYLORAPI",
    referralLink: "https://apiwizard.dev/?ref=taylorapi",
    createdAt: randomPastDate(3),
    updatedAt: randomPastDate(3),
  },
  {
    id: "offer-8",
    projectId: "proj-1",
    creatorId: "creator-1",
    marketerId: "marketer-3",
    status: "pending",
    referralCode: "TAYLORFORM",
    referralLink: "https://formflowpro.io/?ref=taylorform",
    createdAt: randomRecentDate(3),
    updatedAt: randomRecentDate(3),
  },
];

// ============ ANALYTICS EVENTS ============
// Generate realistic event data
function generateEvents(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  let eventIdCounter = 1;

  // Define event generation config per offer
  const offerConfigs: Record<
    string,
    { clicks: number; signupRate: number; conversionRate: number; avgRevenue: number }
  > = {
    "offer-1": { clicks: 4520, signupRate: 0.12, conversionRate: 0.25, avgRevenue: 2900 },
    "offer-2": { clicks: 3200, signupRate: 0.15, conversionRate: 0.30, avgRevenue: 1900 },
    "offer-3": { clicks: 2100, signupRate: 0.10, conversionRate: 0.22, avgRevenue: 2900 },
    "offer-4": { clicks: 1800, signupRate: 0.08, conversionRate: 0.28, avgRevenue: 4900 },
    "offer-6": { clicks: 5600, signupRate: 0.14, conversionRate: 0.32, avgRevenue: 1900 },
    "offer-7": { clicks: 890, signupRate: 0.18, conversionRate: 0.40, avgRevenue: 9900 },
  };

  // Generate events for each approved offer
  offers
    .filter((o) => o.status === "approved")
    .forEach((offer) => {
      const config = offerConfigs[offer.id];
      if (!config) return;

      const project = projects.find((p) => p.id === offer.projectId);
      if (!project) return;

      // Generate click events spread over past months
      for (let i = 0; i < config.clicks; i++) {
        events.push({
          id: `event-${eventIdCounter++}`,
          projectId: offer.projectId,
          marketerId: offer.marketerId,
          type: "click",
          amount: 0,
          currency: "usd",
          createdAt: randomPastDate(4),
        });
      }

      // Generate signup events
      const signups = Math.floor(config.clicks * config.signupRate);
      for (let i = 0; i < signups; i++) {
        const customerId = `cust-${offer.marketerId}-${i}`;
        events.push({
          id: `event-${eventIdCounter++}`,
          projectId: offer.projectId,
          marketerId: offer.marketerId,
          customerId,
          type: "signup",
          amount: 0,
          currency: "usd",
          createdAt: randomPastDate(3),
        });
      }

      // Generate paid subscriptions (with some recurring payments)
      const paidCustomers = Math.floor(signups * config.conversionRate);
      for (let i = 0; i < paidCustomers; i++) {
        const customerId = `cust-${offer.marketerId}-${i}`;
        const isRecurring = project.pricingModel === "subscription";

        // Initial payment
        events.push({
          id: `event-${eventIdCounter++}`,
          projectId: offer.projectId,
          marketerId: offer.marketerId,
          customerId,
          type: "paid_subscription",
          amount: config.avgRevenue,
          currency: "usd",
          isRecurring,
          createdAt: randomPastDate(2),
        });

        // Add some recurring payments for subscriptions
        if (isRecurring && Math.random() > 0.3) {
          const recurringPayments = Math.floor(Math.random() * 4) + 1;
          for (let j = 0; j < recurringPayments; j++) {
            events.push({
              id: `event-${eventIdCounter++}`,
              projectId: offer.projectId,
              marketerId: offer.marketerId,
              customerId,
              type: "paid_subscription",
              amount: config.avgRevenue,
              currency: "usd",
              isRecurring: true,
              createdAt: randomRecentDate(60),
            });
          }
        }
      }

      // Add some churn events
      const churns = Math.floor(paidCustomers * 0.1);
      for (let i = 0; i < churns; i++) {
        const customerId = `cust-${offer.marketerId}-${paidCustomers - i - 1}`;
        events.push({
          id: `event-${eventIdCounter++}`,
          projectId: offer.projectId,
          marketerId: offer.marketerId,
          customerId,
          type: "churn",
          amount: 0,
          currency: "usd",
          createdAt: randomRecentDate(30),
        });
      }

      // Add some refunds
      const refunds = Math.floor(paidCustomers * 0.05);
      for (let i = 0; i < refunds; i++) {
        events.push({
          id: `event-${eventIdCounter++}`,
          projectId: offer.projectId,
          marketerId: offer.marketerId,
          type: "refund",
          amount: config.avgRevenue,
          currency: "usd",
          createdAt: randomRecentDate(20),
        });
      }
    });

  // Add organic traffic events (no marketer)
  projects.forEach((project) => {
    const organicClicks = Math.floor(Math.random() * 2000) + 500;
    const organicSignups = Math.floor(organicClicks * 0.08);
    const organicPaid = Math.floor(organicSignups * 0.20);

    for (let i = 0; i < organicClicks; i++) {
      events.push({
        id: `event-${eventIdCounter++}`,
        projectId: project.id,
        marketerId: null,
        type: "click",
        amount: 0,
        currency: "usd",
        createdAt: randomPastDate(4),
      });
    }

    for (let i = 0; i < organicSignups; i++) {
      events.push({
        id: `event-${eventIdCounter++}`,
        projectId: project.id,
        marketerId: null,
        customerId: `organic-${project.id}-${i}`,
        type: "signup",
        amount: 0,
        currency: "usd",
        createdAt: randomPastDate(3),
      });
    }

    for (let i = 0; i < organicPaid; i++) {
      events.push({
        id: `event-${eventIdCounter++}`,
        projectId: project.id,
        marketerId: null,
        customerId: `organic-${project.id}-${i}`,
        type: "paid_subscription",
        amount: project.price,
        currency: "usd",
        isRecurring: project.pricingModel === "subscription",
        createdAt: randomPastDate(2),
      });
    }
  });

  return events;
}

export const events: AnalyticsEvent[] = generateEvents();

// Export a function to get fresh seed data
export function getSeedData() {
  return {
    users: [...users],
    projects: [...projects],
    offers: [...offers],
    events: [...events],
  };
}
