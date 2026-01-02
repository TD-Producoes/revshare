import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCountryName } from "@/lib/data/countries";

export type SearchProject = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  country: string | null;
  website: string | null;
  revenue: number;
  marketers: number;
  commission: number; // Commission percentage
};

function matchesRevenueRange(revenue: number, range: string): boolean {
  if (range === "100000+") {
    return revenue >= 100000;
  }
  const [min, max] = range.split("-").map(Number);
  return revenue >= min && revenue < max;
}

function matchesCommissionRange(commission: number, range: string): boolean {
  if (range === "30+") {
    return commission >= 30;
  }
  const [min, max] = range.split("-").map(Number);
  return commission >= min && commission < max;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Extract filter parameters
  const search = searchParams.get("search")?.trim() || "";
  const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const revenueRanges = searchParams.get("revenueRanges")?.split(",").filter(Boolean) || [];
  const commissionRanges = searchParams.get("commissionRanges")?.split(",").filter(Boolean) || [];
  const countries = searchParams.get("countries")?.split(",").filter(Boolean) || [];

  // Fetch all projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      logoUrl: true,
      country: true,
      website: true,
      marketerCommissionPercent: true,
    },
  });

  // Calculate stats for each project
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      // Get active marketers count (marketers with active coupons)
      const activeMarketers = await prisma.coupon.groupBy({
        by: ["marketerId"],
        where: {
          projectId: project.id,
          status: "ACTIVE",
        },
      });

      // Get total revenue (all time, in cents, convert to dollars)
      const totalRevenueAgg = await prisma.purchase.aggregate({
        where: { projectId: project.id },
        _sum: { amount: true },
      });

      const totalRevenue = (totalRevenueAgg._sum.amount ?? 0) / 100; // Convert cents to dollars

      // Get commission percentage (convert from decimal to percentage)
      const commissionPercent = project.marketerCommissionPercent
        ? Number(project.marketerCommissionPercent) > 1
          ? Number(project.marketerCommissionPercent)
          : Number(project.marketerCommissionPercent) * 100
        : 0;

      // Get country name if country code exists
      const countryName = project.country ? getCountryName(project.country) : null;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        logoUrl: project.logoUrl,
        country: countryName,
        website: project.website,
        revenue: totalRevenue,
        marketers: activeMarketers.length,
        commission: Math.round(commissionPercent),
      };
    })
  );

  // Apply filters
  let filtered = projectsWithStats;

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        (project.description?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  // Category filter
  if (categories.length > 0) {
    filtered = filtered.filter(
      (project) => project.category && categories.includes(project.category)
    );
  }

  // Revenue range filter
  if (revenueRanges.length > 0) {
    filtered = filtered.filter((project) =>
      revenueRanges.some((range) => matchesRevenueRange(project.revenue, range))
    );
  }

  // Commission range filter
  if (commissionRanges.length > 0) {
    filtered = filtered.filter((project) =>
      commissionRanges.some((range) =>
        matchesCommissionRange(project.commission, range)
      )
    );
  }

  // Country filter
  if (countries.length > 0) {
    filtered = filtered.filter(
      (project) => project.country && countries.includes(project.country)
    );
  }

  // Sort alphabetically by name
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ data: filtered });
}

