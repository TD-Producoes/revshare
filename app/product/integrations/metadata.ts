import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare Integrations - Connect Your Payment Stack",
  description:
    "Integrate RevShare with Stripe, your billing system, and analytics tools. Automatic revenue tracking and commission calculations.",
  keywords: [
    "revshare integrations",
    "stripe integration",
    "affiliate tracking integration",
    "payment integration",
    "saas integrations",
    "revenue tracking",
  ],
  alternates: {
    canonical: "/product/integrations",
  },
  openGraph: {
    title: "RevShare Integrations - Connect Your Payment Stack",
    description:
      "Integrate RevShare with Stripe and your existing tools for automatic revenue tracking.",
    url: `${siteUrl}/product/integrations`,
    type: "website",
  },
  twitter: {
    title: "RevShare Integrations - Connect Your Payment Stack",
    description:
      "Integrate RevShare with Stripe for automatic revenue tracking.",
  },
};
