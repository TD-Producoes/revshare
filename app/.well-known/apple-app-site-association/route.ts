import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Cache for 1 hour - Apple caches aggressively anyway
export const revalidate = 3600;

export async function GET() {
  // Fetch all projects with iOS app configuration
  const projects = await prisma.project.findMany({
    where: {
      appBundleId: { not: null },
      appTeamId: { not: null },
    },
    select: {
      appTeamId: true,
      appBundleId: true,
    },
  });

  // Build unique app IDs
  const appDetails = projects
    .filter((p) => p.appTeamId && p.appBundleId)
    .map((p) => ({
      appID: `${p.appTeamId}.${p.appBundleId}`,
      paths: ["/a/*"],
    }));

  // Deduplicate by appID
  const uniqueDetails = Array.from(
    new Map(appDetails.map((d) => [d.appID, d])).values()
  );

  const aasa = {
    applinks: {
      apps: [],
      details: uniqueDetails.length > 0
        ? uniqueDetails
        : [
            // Fallback to placeholder if no apps registered
            {
              appID: "TEAM_ID.com.example.app",
              paths: ["/a/*"],
            },
          ],
    },
  };

  return NextResponse.json(aasa, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
