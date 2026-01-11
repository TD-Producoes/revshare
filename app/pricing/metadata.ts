import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "Pricing - RevShare Plans for Founders",
  description:
    "RevShare is always free for marketers. See our transparent pricing for founders with no hidden fees. Pay only for results with performance-based plans.",
  keywords: [
    "revshare pricing",
    "affiliate program pricing",
    "saas partnership costs",
    "performance marketing pricing",
    "free affiliate platform",
    "commission-based pricing",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing - RevShare Plans for Founders",
    description:
      "Free for marketers. Transparent pricing for founders. Pay only for results.",
    url: `${siteUrl}/pricing`,
    type: "website",
  },
  twitter: {
    title: "RevShare Pricing - Free for Marketers",
    description:
      "Transparent pricing for founders. Pay only for results.",
  },
};
