import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare Rewards - Milestone Bonuses for Marketers",
  description:
    "Unlock automatic bonuses when you hit revenue milestones. Track progress, earn rewards, and maximize your earnings with RevShare's gamified reward system.",
  keywords: [
    "affiliate rewards",
    "milestone bonuses",
    "performance rewards",
    "marketer incentives",
    "revenue milestones",
    "bonus commissions",
    "affiliate incentive program",
  ],
  alternates: {
    canonical: "/product/rewards",
  },
  openGraph: {
    title: "RevShare Rewards - Milestone Bonuses for Marketers",
    description:
      "Unlock automatic bonuses when you hit revenue milestones. Track progress and maximize earnings.",
    url: `${siteUrl}/product/rewards`,
    type: "website",
  },
  twitter: {
    title: "RevShare Rewards - Milestone Bonuses for Marketers",
    description:
      "Unlock automatic bonuses when you hit revenue milestones.",
  },
};
