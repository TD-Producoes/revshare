"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

export type CreatorPayoutTotals = {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  pendingCreatorCommissions: number;
  awaitingRefundCommissions: number;
  readyCommissions: number;
  failedCommissions: number;
  platformFee: number;
  platformCommissionPercent?: number | null;
  adjustmentsTotal?: number;
};

export type CreatorPayout = {
  marketerId: string;
  marketerName: string;
  marketerEmail: string | null;
  projectCount: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  awaitingCreatorEarnings: number;
  awaitingRefundEarnings: number;
  failedEarnings: number;
  readyEarnings: number;
  adjustmentsTotal?: number;
  netReadyEarnings?: number;
  failureReason?: string | null;
};

export type CreatorDashboardTotals = {
  totalRevenue: number;
  mrr: number;
  affiliateRevenue: number;
  affiliateShareOwed: number;
  platformFee: number;
};

export type CreatorDashboardProject = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  marketerCommissionPercent: string | number | null;
  platformCommissionPercent: string | number | null;
  createdAt: string | Date;
  metrics: {
    totalRevenue: number;
    affiliateRevenue: number;
    mrr: number;
    activeSubscribers: number;
  } | null;
  marketerCount: number;
};

export type CreatorDashboard = {
  totals: CreatorDashboardTotals;
  chart: Array<{ date: string; revenue: number; affiliateRevenue: number }>;
  trends?: {
    totalRevenue?: number | null;
    mrr?: number | null;
  };
  projects: CreatorDashboardProject[];
};

export type CreatorPaymentLine = {
  id: string;
  projectId: string;
  projectName: string;
  marketerId: string | null;
  marketerName: string;
  customerEmail: string | null;
  amount: number;
  marketerCommission: number;
  platformFee: number;
  merchantNet: number;
  currency: string;
  createdAt: string | Date;
};

export type CreatorPaymentPreview = {
  paymentId: string | null;
  purchases: CreatorPaymentLine[];
  perMarketer: Array<{
    marketerId: string | null;
    marketerName: string;
    marketerTotal: number;
    platformTotal: number;
    currency: string | null;
  }>;
  totals: {
    marketerTotal: number;
    platformTotal: number;
    grandTotal: number;
    processingFee: number;
    totalWithFee: number;
    currency: string | null;
  };
};

export type CreatorPaymentHistory = {
  id: string;
  amountTotal: number;
  marketerTotal: number;
  platformFeeTotal: number;
  status: string;
  createdAt: string | Date;
  purchaseCount: number;
  stripeCheckoutSessionId: string | null;
};

export type CreatorMarketerMetrics = {
  marketer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  projects: Array<{
    id: string;
    name: string;
  }>;
  summary: {
    projectRevenue: number;
    affiliateRevenue: number;
    commissionOwed: number;
    purchasesCount: number;
    customersCount: number;
  };
  timeline: Array<{
    date: string;
    projectRevenue: number;
    affiliateRevenue: number;
    commissionOwed: number;
    purchasesCount: number;
    customersCount: number;
  }>;
};

export type CreatorAdjustment = {
  id: string;
  marketerId: string;
  marketerName: string;
  marketerEmail: string | null;
  projectId: string;
  projectName: string;
  purchaseId: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  createdAt: string | Date;
};

export type CreatorPurchase = {
  id: string;
  projectId: string;
  projectName: string;
  customerEmail: string | null;
  amount: number;
  commissionAmount: number;
  platformFee: number;
  commissionStatus: string;
  status: string;
  createdAt: string | Date;
  refundEligibleAt: string | Date | null;
  couponCode: string | null;
  marketer: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export function useCreatorPayouts(userId?: string | null) {
  return useQuery<{ totals: CreatorPayoutTotals; payouts: CreatorPayout[] }>({
    queryKey: ["creator-payouts", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/founder/payouts?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch payouts.");
      }
      const payload = await response.json();
      return payload?.data as {
        totals: CreatorPayoutTotals;
        payouts: CreatorPayout[];
      };
    },
  });
}

export function useCreatorPaymentPreview(userId?: string | null, enabled = true) {
  return useQuery<CreatorPaymentPreview>({
    queryKey: ["creator-payment-preview", userId ?? "none"],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const response = await fetch(`/api/founder/payouts/preview?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to load payout preview.");
      }
      const payload = await response.json();
      return payload?.data as CreatorPaymentPreview;
    },
  });
}

export function useCreatorPaymentCheckout() {
  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const response = await fetch("/api/founder/payouts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create checkout.");
      }
      return data?.data as { id: string; url: string | null };
    },
  });
}

export function useCreatorPaymentCharge() {
  return useMutation({
    mutationFn: async (payload: { userId: string; paymentMethodId?: string }) => {
      const response = await fetch("/api/founder/payouts/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to charge payment method.");
      }
      return data?.data as { id: string; status: string };
    },
  });
}

export function useCreatorAdjustments(userId?: string | null) {
  return useQuery<CreatorAdjustment[]>({
    queryKey: ["creator-adjustments", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/founder/adjustments?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch adjustments.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useCreatorPayments(userId?: string | null) {
  return useQuery<CreatorPaymentHistory[]>({
    queryKey: ["creator-payments", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/founder/payouts/payments?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch payments.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useCreatorPurchaseDetails(userId?: string | null) {
  return useQuery<CreatorPurchase[]>({
    queryKey: ["creator-payout-purchases", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/founder/payouts/purchases?userId=${userId}`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch purchases.");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useProcessMarketerTransfers() {
  return useMutation({
    mutationFn: async (payload: { creatorId: string }) => {
      const response = await fetch("/api/platform/payouts/marketers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to process transfers.");
      }
      return data?.data ?? null;
    },
  });
}

export function useCreatorDashboard(userId?: string | null) {
  return useQuery<CreatorDashboard>({
    queryKey: ["creator-dashboard", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/founder/dashboard?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch dashboard.");
      }
      const payload = await response.json();
      return payload?.data as CreatorDashboard;
    },
  });
}

export type CreatorMarketerSummary = {
  id: string;
  name: string;
  email: string;
  projectCount: number;
  affiliateRevenue: number;
  commissionOwed: number;
  purchasesCount: number;
  customersCount: number;
};

export function useCreatorMarketers(creatorId?: string | null) {
  return useQuery<CreatorMarketerSummary[]>({
    queryKey: ["creator-marketers", creatorId ?? "none"],
    enabled: Boolean(creatorId),
    queryFn: async () => {
      if (!creatorId) return [];
      const response = await fetch(`/api/founder/marketers?creatorId=${creatorId}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch marketers.");
      }
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function usePayCreatorPayouts() {
  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const response = await fetch("/api/founder/payouts/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to send payouts.");
      }
      return data?.data ?? null;
    },
  });
}

export function useCreatorMarketerMetrics(
  marketerId?: string | null,
  projectId?: string | null,
  days = 30,
) {
  return useQuery<CreatorMarketerMetrics>({
    queryKey: [
      "creator-marketer-metrics",
      marketerId ?? "none",
      projectId ?? "all",
      days,
    ],
    enabled: Boolean(marketerId),
    queryFn: async () => {
      if (!marketerId) {
        throw new Error("Missing marketerId");
      }
      const params = new URLSearchParams({ days: String(days) });
      if (projectId) {
        params.set("projectId", projectId);
      }
      const response = await fetch(
        `/api/founder/marketers/${marketerId}/metrics?${params.toString()}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch marketer metrics.");
      }
      return payload?.data as CreatorMarketerMetrics;
    },
  });
}
