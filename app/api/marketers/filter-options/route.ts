import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseUserMetadata } from "@/lib/services/user-metadata";

export async function GET() {
  // Fetch all marketers to extract unique filter options
  const marketers = await prisma.user.findMany({
    where: { role: "marketer" },
    select: {
      metadata: true,
    },
  });

  // Extract unique values from metadata
  const specialtiesSet = new Set<string>();
  const locationsSet = new Set<string>();
  const focusAreasSet = new Set<string>();

  marketers.forEach((marketer) => {
    const metadata = parseUserMetadata(marketer.metadata);

    // Extract specialties
    if (metadata.specialties && Array.isArray(metadata.specialties)) {
      metadata.specialties.forEach((specialty) => {
        if (typeof specialty === "string" && specialty.trim()) {
          specialtiesSet.add(specialty.trim());
        }
      });
    }

    // Extract location
    if (metadata.location && typeof metadata.location === "string") {
      locationsSet.add(metadata.location.trim());
    }

    // Extract focus area
    if (metadata.focusArea && typeof metadata.focusArea === "string") {
      focusAreasSet.add(metadata.focusArea.trim());
    }
  });

  // Convert to sorted arrays
  const specialties = Array.from(specialtiesSet).sort();
  const locations = Array.from(locationsSet).sort();
  const focusAreas = Array.from(focusAreasSet).sort();

  return NextResponse.json({
    data: {
      specialties,
      locations,
      focusAreas,
    },
  });
}

