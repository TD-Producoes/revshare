import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

/**
 * GET /api/revclaw/installations
 *
 * Lists RevClaw installations (bots) connected to the authenticated user.
 * Authentication: Human user (session-based)
 */
export async function GET() {
  try {
    const authUser = await requireAuthUser();

    const installations = await prisma.revclawInstallation.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        grantedScopes: true,
        requireApprovalForPublish: true,
        requireApprovalForApply: true,
        dailyApplyLimit: true,
        allowedCategories: true,
        createdAt: true,
        lastTokenIssuedAt: true,
        revokedAt: true,
        revokeReason: true,
        agent: {
          select: {
            id: true,
            name: true,
            manifestUrl: true,
            manifestSnapshotHash: true,
            identityProofUrl: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ data: installations }, { status: 200 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
