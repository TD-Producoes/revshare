import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "How RevShare Works - From Discovery to Payout",
  description:
    "Learn how RevShare connects SaaS founders with marketers in 3 simple phases: Discovery, Setup, and Execution. Stripe-verified revenue sharing made transparent.",
  keywords: [
    "how revshare works",
    "revenue sharing process",
    "affiliate partnership steps",
    "saas partnership workflow",
    "stripe verified commissions",
    "automated payouts",
  ],
  alternates: {
    canonical: "/product/how-it-works",
  },
  openGraph: {
    title: "How RevShare Works - From Discovery to Payout",
    description:
      "Learn how RevShare connects SaaS founders with marketers in 3 simple phases: Discovery, Setup, and Execution.",
    url: `${siteUrl}/product/how-it-works`,
    type: "article",
  },
  twitter: {
    title: "How RevShare Works - From Discovery to Payout",
    description:
      "Learn how RevShare connects SaaS founders with marketers in 3 simple phases.",
  },
};
