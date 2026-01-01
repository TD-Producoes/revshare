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
      const response = await fetch(`/api/creator/payouts?userId=${userId}`);
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
      const response = await fetch(`/api/creator/payouts/preview?userId=${userId}`);
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
      const response = await fetch("/api/creator/payouts/checkout", {
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
    mutationFn: async (payload: { userId: string }) => {
      const response = await fetch("/api/creator/payouts/charge", {
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

export function useCreatorPayments(userId?: string | null) {
  return useQuery<CreatorPaymentHistory[]>({
    queryKey: ["creator-payments", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`/api/creator/payouts/payments?userId=${userId}`);
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
        `/api/creator/payouts/purchases?userId=${userId}`,
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
      const response = await fetch(`/api/creator/dashboard?userId=${userId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to fetch dashboard.");
      }
      const payload = await response.json();
      return payload?.data as CreatorDashboard;
    },
  });
}

export function usePayCreatorPayouts() {
  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const response = await fetch("/api/creator/payouts/pay", {
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
