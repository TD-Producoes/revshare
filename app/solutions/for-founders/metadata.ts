import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare for Founders - Grow Your SaaS with Performance Partners",
  description:
    "List your SaaS product, recruit performance marketers, and only pay when they bring revenue. Stripe-verified tracking, refund protection, and automated payouts.",
  keywords: [
    "saas growth",
    "performance marketing for saas",
    "affiliate program for saas",
    "revenue share program",
    "find affiliates",
    "saas partner program",
    "indie saas marketing",
    "founder marketing",
    "performance-based growth",
  ],
  alternates: {
    canonical: "/solutions/for-founders",
  },
  openGraph: {
    title: "RevShare for Founders - Grow Your SaaS with Performance Partners",
    description:
      "List your SaaS product, recruit marketers, and only pay when they bring revenue.",
    url: `${siteUrl}/solutions/for-founders`,
    type: "website",
  },
  twitter: {
    title: "RevShare for Founders - Performance-Based SaaS Growth",
    description:
      "List your SaaS, recruit marketers, pay only for results.",
  },
};
