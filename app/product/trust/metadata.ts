import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "Trust & Security - Stripe-Powered Payments on RevShare",
  description:
    "RevShare uses Stripe Connect for secure payouts, refund-aware commissions, and immutable audit trails. See how we protect both founders and marketers.",
  keywords: [
    "stripe connect payouts",
    "secure affiliate payments",
    "refund protection",
    "commission security",
    "transparent payments",
    "audit trail",
    "affiliate payment security",
  ],
  alternates: {
    canonical: "/product/trust",
  },
  openGraph: {
    title: "Trust & Security - Stripe-Powered Payments on RevShare",
    description:
      "Secure Stripe Connect payouts, refund-aware commissions, and immutable audit trails.",
    url: `${siteUrl}/product/trust`,
    type: "website",
  },
  twitter: {
    title: "Trust & Security - Stripe-Powered Payments on RevShare",
    description:
      "Secure Stripe Connect payouts with refund protection and audit trails.",
  },
};
