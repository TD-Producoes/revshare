import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCountryName } from "@/lib/data/countries";

export async function GET() {
  // Fetch all projects to extract unique filter options
  const projects = await prisma.project.findMany({
    select: {
      category: true,
      country: true,
    },
  });

  // Extract unique categories
  const categories = Array.from(
    new Set(
      projects
        .map((p) => p.category)
        .filter((cat): cat is string => Boolean(cat))
    )
  ).sort();

  // Extract unique countries (convert codes to names)
  const countryCodes = Array.from(
    new Set(
      projects
        .map((p) => p.country)
        .filter((code): code is string => Boolean(code))
    )
  );

  const countries = countryCodes
    .map((code) => getCountryName(code))
    .filter((name): name is string => Boolean(name))
    .sort();

  return NextResponse.json({
    data: {
      categories,
      countries,
    },
  });
}

