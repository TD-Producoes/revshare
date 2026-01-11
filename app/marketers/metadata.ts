import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "Performance Marketers Directory - Find Verified Affiliates",
  description:
    "Discover verified performance marketers with proven track records. See revenue driven, conversion rates, and specialties. Recruit directly for your SaaS.",
  keywords: [
    "find affiliates",
    "performance marketers",
    "affiliate recruitment",
    "saas affiliates",
    "verified marketers",
    "influencer marketing",
    "partner recruitment",
  ],
  alternates: {
    canonical: "/marketers",
  },
  openGraph: {
    title: "Performance Marketers Directory - Find Verified Affiliates",
    description:
      "Discover verified performance marketers with proven track records. Recruit directly.",
    url: `${siteUrl}/marketers`,
    type: "website",
  },
  twitter: {
    title: "Performance Marketers Directory",
    description:
      "Find verified affiliates with proven track records for your SaaS.",
  },
};
