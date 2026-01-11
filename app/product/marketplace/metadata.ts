import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare Marketplace - The Open Economy of Partnerships",
  description:
    "Browse verified SaaS products and performance marketers in our public marketplace. Direct applications, verified revenue stats, and transparent commission rates.",
  keywords: [
    "saas marketplace",
    "affiliate marketplace",
    "performance marketer directory",
    "saas products directory",
    "revshare marketplace",
    "find affiliates",
    "find saas products to promote",
  ],
  alternates: {
    canonical: "/product/marketplace",
  },
  openGraph: {
    title: "RevShare Marketplace - The Open Economy of Partnerships",
    description:
      "Browse verified SaaS products and performance marketers in our public marketplace.",
    url: `${siteUrl}/product/marketplace`,
    type: "website",
  },
  twitter: {
    title: "RevShare Marketplace - The Open Economy of Partnerships",
    description:
      "Browse verified SaaS products and performance marketers in our public marketplace.",
  },
};
