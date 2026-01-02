import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseUserMetadata } from "@/lib/services/user-metadata";

export type SearchMarketer = {
  id: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  specialties?: string[];
  focusArea?: string | null;
  totalEarnings: number;
  totalRevenue: number;
  activeProjects: number;
};

function matchesEarningsRange(earnings: number, range: string): boolean {
  if (range === "100000+") {
    return earnings >= 100000;
  }
  const [min, max] = range.split("-").map((v) =>
    v === "+" ? Infinity : parseInt(v.replace(/\D/g, ""), 10)
  );
  return earnings >= min && earnings < max;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Extract filter parameters
  const search = searchParams.get("search")?.trim() || "";
  const specialties = searchParams.get("specialties")?.split(",").filter(Boolean) || [];
  const earningsRanges = searchParams.get("earningsRanges")?.split(",").filter(Boolean) || [];
  const locations = searchParams.get("locations")?.split(",").filter(Boolean) || [];
  const focusAreas = searchParams.get("focusAreas")?.split(",").filter(Boolean) || [];

  // Fetch all marketers
  const marketers = await prisma.user.findMany({
    where: { role: "marketer" },
    select: {
      id: true,
      name: true,
      metadata: true,
    },
  });

  // Calculate stats for each marketer
  const marketersWithStats = await Promise.all(
    marketers.map(async (marketer) => {
      // Get all purchases for this marketer
      const purchases = await prisma.purchase.findMany({
        where: { coupon: { marketerId: marketer.id } },
        select: {
          amount: true,
          commissionAmount: true,
        },
      });

      // Get active projects (projects with approved contracts)
      const activeContracts = await prisma.contract.findMany({
        where: {
          userId: marketer.id,
          status: "APPROVED",
        },
        select: {
          projectId: true,
        },
      });

      const activeProjects = new Set(activeContracts.map((c) => c.projectId)).size;

      // Calculate total earnings and revenue (convert cents to dollars)
      const totalEarnings = purchases.reduce((sum, p) => sum + p.commissionAmount, 0) / 100;
      const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0) / 100;

      // Parse metadata
      const metadata = parseUserMetadata(marketer.metadata);
      const specialties = metadata.specialties || [];
      const location = metadata.location || null;
      const focusArea = metadata.focusArea || null;
      const bio = metadata.bio || null;

      // Get avatar URL from X profile
      let avatarUrl: string | null = null;
      const xProfile = metadata.socialMedia?.x;
      if (xProfile?.handle) {
        const handle = xProfile.handle.replace(/^@/, "");
        avatarUrl = `https://unavatar.io/x/${handle}`;
      }

      return {
        id: marketer.id,
        name: marketer.name,
        bio,
        avatarUrl,
        location,
        specialties,
        focusArea,
        totalEarnings,
        totalRevenue,
        activeProjects,
      };
    })
  );

  // Apply filters
  let filtered = marketersWithStats;

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (marketer) =>
        marketer.name.toLowerCase().includes(searchLower) ||
        (marketer.bio?.toLowerCase().includes(searchLower) ?? false) ||
        marketer.specialties?.some((s) => s.toLowerCase().includes(searchLower))
    );
  }

  // Specialties filter
  if (specialties.length > 0) {
    filtered = filtered.filter((marketer) =>
      marketer.specialties?.some((s) => specialties.includes(s))
    );
  }

  // Earnings range filter
  if (earningsRanges.length > 0) {
    filtered = filtered.filter((marketer) =>
      earningsRanges.some((range) => matchesEarningsRange(marketer.totalEarnings, range))
    );
  }

  // Location filter
  if (locations.length > 0) {
    filtered = filtered.filter(
      (marketer) => marketer.location && locations.includes(marketer.location)
    );
  }

  // Focus area filter
  if (focusAreas.length > 0) {
    filtered = filtered.filter(
      (marketer) => marketer.focusArea && focusAreas.includes(marketer.focusArea)
    );
  }

  // Sort alphabetically by name
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ data: filtered });
}

