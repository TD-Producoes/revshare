import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseUserMetadata } from "@/lib/services/user-metadata";
import { getAuthUserOptional } from "@/lib/auth";
import { redactMarketerData } from "@/lib/services/visibility";

export type SearchMarketer = {
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
  applications: number;
  successRate: number; // 0..1
  clicks30d: number;
  installs30d: number;
  purchases30d: number;
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
  const authUser = await getAuthUserOptional();
  const { searchParams } = new URL(request.url);

  // Extract filter parameters
  const search = searchParams.get("search")?.trim() || "";
  const specialtiesFilter =
    searchParams.get("specialties")?.split(",").filter(Boolean) || [];
  const earningsRanges =
    searchParams.get("earningsRanges")?.split(",").filter(Boolean) || [];
  const locationsFilter =
    searchParams.get("locations")?.split(",").filter(Boolean) || [];
  const focusAreasFilter =
    searchParams.get("focusAreas")?.split(",").filter(Boolean) || [];

  // 1) Fetch marketers (respecting visibility)
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
    orderBy: { createdAt: "desc" },
  });

  const marketerIds = marketers.map((m) => m.id);

  // 2) Bulk-load data needed for stats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    purchases,
    approvedContracts,
    allContracts,
    metrics30d,
  ] = await Promise.all([
    prisma.purchase.findMany({
      where: {
        status: "PAID",
        coupon: { marketerId: { in: marketerIds } },
      },
      select: {
        amount: true,
        commissionAmount: true,
        coupon: { select: { marketerId: true } },
      },
    }),
    prisma.contract.findMany({
      where: { userId: { in: marketerIds }, status: "APPROVED" },
      select: { userId: true, projectId: true },
    }),
    prisma.contract.findMany({
      where: { userId: { in: marketerIds } },
      select: { userId: true, status: true },
    }),
    prisma.marketerMetricsSnapshot.groupBy({
      by: ["marketerId"],
      where: {
        marketerId: { in: marketerIds },
        date: { gte: thirtyDaysAgo },
      },
      _sum: {
        clicksCountDay: true,
        installsCountDay: true,
        purchasesCountDay: true,
      },
    }),
  ]);

  const earningsByMarketer = new Map<string, number>();
  const revenueByMarketer = new Map<string, number>();
  for (const purchase of purchases) {
    const marketerId = purchase.coupon?.marketerId;
    if (!marketerId) continue;
    earningsByMarketer.set(
      marketerId,
      (earningsByMarketer.get(marketerId) ?? 0) + purchase.commissionAmount
    );
    revenueByMarketer.set(
      marketerId,
      (revenueByMarketer.get(marketerId) ?? 0) + purchase.amount
    );
  }

  const activeProjectsByMarketer = new Map<string, Set<string>>();
  for (const contract of approvedContracts) {
    const set = activeProjectsByMarketer.get(contract.userId) ?? new Set();
    set.add(contract.projectId);
    activeProjectsByMarketer.set(contract.userId, set);
  }

  const applicationsByMarketer = new Map<string, number>();
  const approvedByMarketer = new Map<string, number>();
  for (const contract of allContracts) {
    applicationsByMarketer.set(
      contract.userId,
      (applicationsByMarketer.get(contract.userId) ?? 0) + 1
    );
    if (contract.status === "APPROVED") {
      approvedByMarketer.set(
        contract.userId,
        (approvedByMarketer.get(contract.userId) ?? 0) + 1
      );
    }
  }

  const metricsByMarketer = new Map<
    string,
    { clicks30d: number; installs30d: number; purchases30d: number }
  >();
  for (const row of metrics30d) {
    metricsByMarketer.set(row.marketerId, {
      clicks30d: row._sum.clicksCountDay ?? 0,
      installs30d: row._sum.installsCountDay ?? 0,
      purchases30d: row._sum.purchasesCountDay ?? 0,
    });
  }

  // 3) Assemble rows + redact
  const marketersWithStats = marketers
    .map((marketer) => {
      const totalEarnings = (earningsByMarketer.get(marketer.id) ?? 0) / 100;
      const totalRevenue = (revenueByMarketer.get(marketer.id) ?? 0) / 100;

      const activeProjects =
        activeProjectsByMarketer.get(marketer.id)?.size ?? 0;

      const applications = applicationsByMarketer.get(marketer.id) ?? 0;
      const approved = approvedByMarketer.get(marketer.id) ?? 0;
      const successRate = applications > 0 ? approved / applications : 0;

      const metadata = parseUserMetadata(marketer.metadata);
      const marketerSpecialties = metadata.specialties || [];
      const location = metadata.location || null;
      const focusArea = metadata.focusArea || null;
      const bio = metadata.bio || null;

      // Avatar URL from X profile (if present)
      let avatarUrl: string | null = null;
      const xProfile = metadata.socialMedia?.x;
      if (xProfile?.handle) {
        const handle = xProfile.handle.replace(/^@/, "");
        avatarUrl = `https://unavatar.io/x/${handle}`;
      }

      const engagement = metricsByMarketer.get(marketer.id) ?? {
        clicks30d: 0,
        installs30d: 0,
        purchases30d: 0,
      };

      const redacted = redactMarketerData(
        {
          id: marketer.id,
          name: marketer.name,
          bio,
          avatarUrl,
          location,
          specialties: marketerSpecialties,
          focusArea,
          totalEarnings,
          totalRevenue,
          activeProjects,
          applications,
          successRate,
          ...engagement,
          visibility: marketer.visibility,
          metadata: marketer.metadata,
        },
        authUser?.id === marketer.id
      );

      return redacted as SearchMarketer | null;
    })
    .filter(
      (marketer): marketer is NonNullable<typeof marketer> => marketer !== null
    );

  // 4) Apply filters
  let filtered = marketersWithStats;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (marketer) =>
        (marketer.name?.toLowerCase().includes(searchLower) ?? false) ||
        (marketer.bio?.toLowerCase().includes(searchLower) ?? false) ||
        marketer.specialties?.some((s) => s.toLowerCase().includes(searchLower))
    );
  }

  if (specialtiesFilter.length > 0) {
    filtered = filtered.filter((marketer) =>
      marketer.specialties?.some((s) => specialtiesFilter.includes(s))
    );
  }

  if (earningsRanges.length > 0) {
    filtered = filtered.filter((marketer) =>
      earningsRanges.some((range) => matchesEarningsRange(marketer.totalEarnings, range))
    );
  }

  if (locationsFilter.length > 0) {
    filtered = filtered.filter(
      (marketer) => marketer.location && locationsFilter.includes(marketer.location)
    );
  }

  if (focusAreasFilter.length > 0) {
    filtered = filtered.filter(
      (marketer) => marketer.focusArea && focusAreasFilter.includes(marketer.focusArea)
    );
  }

  // Sort alphabetically by name (null names go to the end)
  filtered.sort((a, b) => {
    if (a.name === null && b.name === null) return 0;
    if (a.name === null) return 1;
    if (b.name === null) return -1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ data: filtered });
}
