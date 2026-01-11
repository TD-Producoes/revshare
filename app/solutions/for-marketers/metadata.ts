import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare for Marketers - Earn Recurring SaaS Commissions",
  description:
    "Discover high-paying SaaS products to promote. Always free, real-time tracking, Stripe payouts, and milestone bonuses. No network fees or payout cuts.",
  keywords: [
    "affiliate marketing",
    "saas affiliate programs",
    "recurring commissions",
    "performance marketing",
    "earn money promoting saas",
    "best affiliate programs",
    "high paying affiliate",
    "marketer earnings",
    "no fee affiliate network",
  ],
  alternates: {
    canonical: "/solutions/for-marketers",
  },
  openGraph: {
    title: "RevShare for Marketers - Earn Recurring SaaS Commissions",
    description:
      "Discover high-paying SaaS products. Always free, real-time tracking, Stripe payouts.",
    url: `${siteUrl}/solutions/for-marketers`,
    type: "website",
  },
  twitter: {
    title: "RevShare for Marketers - Free, No Payout Cuts",
    description:
      "Earn recurring commissions promoting verified SaaS products.",
  },
};
