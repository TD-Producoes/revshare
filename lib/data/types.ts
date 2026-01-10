// Data types for the marketplace

export type UserRole = "founder" | "marketer";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl?: string;
  stripeConnected?: boolean; // For founders
}

export type PricingModel = "subscription" | "one-time";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  pricingModel: PricingModel;
  price: number; // in cents
  publicMetrics: {
    mrr: number; // in cents
    activeSubscribers: number;
  };
  revSharePercent: number; // e.g., 20 for 20%
  cookieWindowDays: number;
  createdAt: Date;
}

export type OfferStatus = "pending" | "approved" | "rejected";

export interface Offer {
  id: string;
  projectId: string;
  creatorId: string;
  marketerId: string;
  status: OfferStatus;
  referralCode: string;
  referralLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EventType =
  | "click"
  | "signup"
  | "paid_subscription"
  | "churn"
  | "refund";

export interface AnalyticsEvent {
  id: string;
  projectId: string;
  marketerId: string | null; // null if organic
  customerId?: string; // unique customer identifier
  type: EventType;
  amount: number; // in cents, 0 for clicks/signups
  currency: string;
  isRecurring?: boolean; // for subscriptions
  createdAt: Date;
}

// Computed metric types
export interface MarketerProjectMetrics {
  clicks: number;
  signups: number;
  paidCustomers: number;
  mrr: number;
  conversionRate: number;
  earnings: number;
}

export interface CreatorMetrics {
  totalRevenue: number;
  mrr: number;
  affiliateRevenue: number;
  affiliateShareOwed: number;
  platformFee: number;
}

export interface ProjectMetrics {
  totalRevenue: number;
  mrr: number;
  affiliateRevenue: number;
  activeSubscribers: number;
}
