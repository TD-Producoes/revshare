import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "SaaS Projects Directory - Find Revenue Share Programs",
  description:
    "Browse verified SaaS products with active revenue share programs. See commission rates, MRR stats, and refund windows. Apply directly to founders.",
  keywords: [
    "saas affiliate programs",
    "revenue share programs",
    "saas products to promote",
    "affiliate opportunities",
    "high commission saas",
    "recurring commission programs",
    "saas partner programs",
  ],
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "SaaS Projects Directory - Find Revenue Share Programs",
    description:
      "Browse verified SaaS products with active revenue share programs. Apply directly to founders.",
    url: `${siteUrl}/projects`,
    type: "website",
  },
  twitter: {
    title: "SaaS Projects Directory - RevShare Programs",
    description:
      "Find high-paying SaaS products to promote with recurring commissions.",
  },
};
