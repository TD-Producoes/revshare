import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare vs Affiliate Marketing - Understanding the Difference",
  description:
    "Learn how revenue sharing differs from traditional affiliate marketing. Compare recurring commissions, transparency, and long-term partnership benefits.",
  keywords: [
    "revshare vs affiliate",
    "revenue sharing vs affiliate marketing",
    "recurring commissions",
    "affiliate marketing comparison",
    "revshare benefits",
    "performance marketing models",
    "saas affiliate programs",
  ],
  alternates: {
    canonical: "/product/revshare-vs-affiliate-marketing",
  },
  openGraph: {
    title: "RevShare vs Affiliate Marketing - Understanding the Difference",
    description:
      "Compare revenue sharing with traditional affiliate marketing. Learn about recurring commissions and transparency.",
    url: `${siteUrl}/product/revshare-vs-affiliate-marketing`,
    type: "article",
  },
  twitter: {
    title: "RevShare vs Affiliate Marketing - What's the Difference?",
    description:
      "Compare revenue sharing with traditional affiliate marketing models.",
  },
};
