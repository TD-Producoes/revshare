// Preview/Example data for pre-launch marketplace
// These are example entries to demonstrate the platform capabilities

export interface PreviewProject {
  id: string;
  name: string;
  description: string;
  category: string;
  commissionPercent: number;
  pricingModel: string;
  logoUrl?: string;
  website?: string;
  features: string[];
}

export interface PreviewMarketer {
  id: string;
  name: string;
  promotionTypes: string[];
  industries: string[];
  isVerified: boolean;
  avatarUrl?: string;
  bio: string;
}

export const previewProjects: PreviewProject[] = [
  {
    id: "preview-1",
    name: "FlowMetrics Pro",
    description: "Analytics dashboard for SaaS companies. Get insights on user behavior, conversion funnels, and revenue metrics in real-time.",
    category: "Analytics",
    commissionPercent: 25,
    pricingModel: "Subscription",
    features: ["Real-time dashboards", "Cohort analysis", "Revenue tracking"],
  },
  {
    id: "preview-2",
    name: "BuildStack",
    description: "All-in-one project management for remote dev teams. Kanban boards, time tracking, and CI/CD integrations.",
    category: "Developer Tools",
    commissionPercent: 20,
    pricingModel: "Subscription",
    features: ["Team collaboration", "CI/CD integration", "Time tracking"],
  },
  {
    id: "preview-3",
    name: "CopyGenius AI",
    description: "AI-powered copywriting assistant for marketing teams. Generate ads, emails, and landing pages in seconds.",
    category: "AI / Marketing",
    commissionPercent: 30,
    pricingModel: "Subscription",
    features: ["AI copywriting", "Brand voice training", "Multi-language"],
  },
  {
    id: "preview-4",
    name: "InvoiceFlow",
    description: "Smart invoicing and payment collection for freelancers and agencies. Automatic reminders and Stripe integration.",
    category: "Finance",
    commissionPercent: 22,
    pricingModel: "Subscription",
    features: ["Recurring invoices", "Payment reminders", "Expense tracking"],
  },
  {
    id: "preview-5",
    name: "HelpDesk Central",
    description: "Modern customer support platform with AI-powered ticket routing and knowledge base.",
    category: "Customer Support",
    commissionPercent: 18,
    pricingModel: "Subscription",
    features: ["AI ticket routing", "Live chat", "Knowledge base"],
  },
  {
    id: "preview-6",
    name: "ScheduleNinja",
    description: "Appointment scheduling for service businesses. Calendar sync, automated reminders, and payment collection.",
    category: "Productivity",
    commissionPercent: 25,
    pricingModel: "Subscription",
    features: ["Calendar sync", "Automated reminders", "Online payments"],
  },
];

export const previewMarketers: PreviewMarketer[] = [
  {
    id: "preview-marketer-1",
    name: "Alex Chen",
    promotionTypes: ["Content Marketing", "SEO"],
    industries: ["SaaS", "Developer Tools"],
    isVerified: true,
    bio: "Content strategist specializing in B2B SaaS. Built audiences of 100k+ for multiple tech companies.",
  },
  {
    id: "preview-marketer-2",
    name: "Sarah Mitchell",
    promotionTypes: ["Paid Ads", "Social Media"],
    industries: ["E-commerce", "DTC Brands"],
    isVerified: true,
    bio: "Performance marketer with 8+ years scaling paid acquisition for SaaS and e-commerce.",
  },
  {
    id: "preview-marketer-3",
    name: "Marcus Johnson",
    promotionTypes: ["YouTube", "Video Content"],
    industries: ["Tech", "Productivity"],
    isVerified: true,
    bio: "Tech YouTuber and reviewer. Partnered with 50+ software companies for product launches.",
  },
  {
    id: "preview-marketer-4",
    name: "Emma Rodriguez",
    promotionTypes: ["Newsletter", "Email Marketing"],
    industries: ["Finance", "Startups"],
    isVerified: false,
    bio: "Newsletter operator with 25k+ subscribers in the startup/finance space.",
  },
  {
    id: "preview-marketer-5",
    name: "Liam O'Connor",
    promotionTypes: ["Affiliate Marketing", "Partnerships"],
    industries: ["SaaS", "Marketing"],
    isVerified: true,
    bio: "Affiliate marketer focused on SaaS products. Generated $500k+ in affiliate revenue last year.",
  },
];

// Category options for filters
export const previewCategories = [
  "All Categories",
  "Analytics",
  "Developer Tools",
  "AI / Marketing",
  "Finance",
  "Customer Support",
  "Productivity",
  "E-commerce",
];

// Commission filter options
export const commissionRanges = [
  { label: "All Commissions", min: 0, max: 100 },
  { label: "15%+", min: 15, max: 100 },
  { label: "20%+", min: 20, max: 100 },
  { label: "25%+", min: 25, max: 100 },
];
