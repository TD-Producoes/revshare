import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  // Fetch all projects with Android app configuration
  const projects = await prisma.project.findMany({
    where: {
      androidPackageName: { not: null },
      androidSha256Fingerprint: { not: null },
    },
    select: {
      androidPackageName: true,
      androidSha256Fingerprint: true,
    },
  });

  // Build asset links array
  const assetLinks = projects
    .filter((p) => p.androidPackageName && p.androidSha256Fingerprint)
    .map((p) => ({
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: p.androidPackageName,
        sha256_cert_fingerprints: [p.androidSha256Fingerprint],
      },
    }));

  // Deduplicate by package name
  const uniqueLinks = Array.from(
    new Map(assetLinks.map((l) => [l.target.package_name, l])).values()
  );

  // Return empty array if no apps registered (valid for Android)
  return NextResponse.json(uniqueLinks.length > 0 ? uniqueLinks : [], {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
