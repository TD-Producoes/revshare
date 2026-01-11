import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";

export const metadata: Metadata = {
  title: "RevShare vs Affiliate Networks - No Middlemen, Better Payouts",
  description:
    "Compare RevShare to ShareASale, Impact, and PartnerStack. See why direct founder-marketer connections mean better commissions and faster payouts.",
  keywords: [
    "revshare vs shareasale",
    "revshare vs impact",
    "revshare vs partnerstack",
    "affiliate network alternative",
    "best affiliate network",
    "affiliate network comparison",
    "no middleman affiliate",
  ],
  alternates: {
    canonical: "/product/revshare-vs-affiliate-networks",
  },
  openGraph: {
    title: "RevShare vs Affiliate Networks - No Middlemen, Better Payouts",
    description:
      "Compare RevShare to traditional affiliate networks. Direct connections mean better commissions.",
    url: `${siteUrl}/product/revshare-vs-affiliate-networks`,
    type: "article",
  },
  twitter: {
    title: "RevShare vs Affiliate Networks - Why Direct is Better",
    description:
      "Compare RevShare to ShareASale, Impact, and PartnerStack.",
  },
};
