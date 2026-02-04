import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/revclaw/installations/:id
 *
 * Installation detail for the authenticated user.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await params;

    const installation = await prisma.revclawInstallation.findUnique({
      where: { id },
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
        userId: true,
        agent: {
          select: {
            id: true,
            name: true,
            manifestUrl: true,
            manifestSnapshot: true,
            manifestSnapshotHash: true,
            identityProofUrl: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 });
    }

    if (installation.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: installation }, { status: 200 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
