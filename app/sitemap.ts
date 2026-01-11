import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";
  const now = new Date();

  // Define routes with their priorities and change frequencies
  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  }> = [
    // Homepage - highest priority
    { path: "/", priority: 1.0, changeFrequency: "daily" },

    // Solution pages - high priority landing pages
    { path: "/solutions/for-founders", priority: 0.9, changeFrequency: "weekly" },
    { path: "/solutions/for-marketers", priority: 0.9, changeFrequency: "weekly" },

    // Directory pages - frequently updated content
    { path: "/projects", priority: 0.9, changeFrequency: "daily" },
    { path: "/marketers", priority: 0.9, changeFrequency: "daily" },

    // Product pages - important for SEO
    { path: "/product/marketplace", priority: 0.8, changeFrequency: "weekly" },
    { path: "/product/how-it-works", priority: 0.8, changeFrequency: "monthly" },
    { path: "/product/rewards", priority: 0.7, changeFrequency: "monthly" },
    { path: "/product/trust", priority: 0.7, changeFrequency: "monthly" },
    { path: "/product/integrations", priority: 0.7, changeFrequency: "monthly" },

    // Comparison pages - important for search intent
    { path: "/product/revshare-vs-affiliate-marketing", priority: 0.8, changeFrequency: "monthly" },
    { path: "/product/revshare-vs-affiliate-networks", priority: 0.8, changeFrequency: "monthly" },

    // Pricing page
    { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },

    // Authentication pages - lower priority
    { path: "/login", priority: 0.3, changeFrequency: "yearly" },
    { path: "/signup", priority: 0.5, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
