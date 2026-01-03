import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseUserMetadata } from "@/lib/services/user-metadata";
import { createClient } from "@/lib/supabase/server";
import { redactMarketerData } from "@/lib/services/visibility";

export type SearchMarketer = {
  // ... (rest of SearchMarketer)
  id: string;
  name: string | null; // null in GHOST mode
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
  const [min, max] = range
    .split("-")
    .map((v) => (v === "+" ? Infinity : parseInt(v.replace(/\D/g, ""), 10)));
  return earnings >= min && earnings < max;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);

  // Extract filter parameters
  const search = searchParams.get("search")?.trim() || "";
  const specialties =
    searchParams.get("specialties")?.split(",").filter(Boolean) || [];
  const earningsRanges =
    searchParams.get("earningsRanges")?.split(",").filter(Boolean) || [];
  const locations =
    searchParams.get("locations")?.split(",").filter(Boolean) || [];
  const focusAreas =
    searchParams.get("focusAreas")?.split(",").filter(Boolean) || [];

  // Fetch all marketers (respecting visibility)
  const marketers = await prisma.user.findMany({
    where: {
      role: "marketer",
      OR: [
        { visibility: { in: ["PUBLIC", "GHOST"] } },
        ...(authUser ? [{ id: authUser.id }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      metadata: true,
      visibility: true,
    },
  });

  // Calculate stats for each marketer
  const marketersWithStats = (
    await Promise.all(
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

        const activeProjects = new Set(activeContracts.map((c) => c.projectId))
          .size;

        // Calculate total earnings and revenue (convert cents to dollars)
        const totalEarnings =
          purchases.reduce((sum, p) => sum + p.commissionAmount, 0) / 100;
        const totalRevenue =
          purchases.reduce((sum, p) => sum + p.amount, 0) / 100;

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

        const redacted = redactMarketerData(
          {
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
            visibility: marketer.visibility,
            metadata: marketer.metadata,
          },
          authUser?.id === marketer.id
        );

        return redacted;
      })
    )
  ).filter(
    (marketer): marketer is NonNullable<typeof marketer> => marketer !== null
  );

  // Apply filters
  let filtered = marketersWithStats;

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (marketer) =>
        (marketer.name?.toLowerCase().includes(searchLower) ?? false) ||
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
      earningsRanges.some((range) =>
        matchesEarningsRange(marketer.totalEarnings, range)
      )
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
      (marketer) =>
        marketer.focusArea && focusAreas.includes(marketer.focusArea)
    );
  }

  // Sort alphabetically by name (null names go to the end)
  filtered.sort((a, b) => {
    if (a.name === null && b.name === null) return 0;
    if (a.name === null) return 1; // null goes to end
    if (b.name === null) return -1; // null goes to end
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ data: filtered });
}
