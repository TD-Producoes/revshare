import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { requireAuthUser, authErrorResponse } from "@/lib/auth";

/**
 * POST /api/revclaw/installations/:id/revoke - Revoke Installation
 * 
 * Allows a human user to revoke an agent installation.
 * This invalidates all tokens for this installation.
 * 
 * Authentication: Human user (session-based, via Supabase Auth)
 * Authorization: User must own the installation
 * Input: {} (empty)
 * Output: { status: "revoked" }
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    // 1. Require authenticated user (session-based)
    const authUser = await requireAuthUser();
    const { id: installationId } = await params;

    // 2. Find installation
    const installation = await prisma.revclawInstallation.findUnique({
      where: { id: installationId },
      select: {
        id: true,
        userId: true,
        agentId: true,
        status: true,
        agent: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!installation) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 }
      );
    }

    // 3. Verify user owns this installation
    if (installation.userId !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this installation" },
        { status: 403 }
      );
    }

    // 4. Check if already revoked
    if (installation.status === "REVOKED") {
      return NextResponse.json(
        { status: "revoked", message: "Installation was already revoked" },
        { status: 200 }
      );
    }

    // 5. Revoke installation and all tokens (transaction)
    await prisma.$transaction(async (tx) => {
      // Mark installation as revoked
      await tx.revclawInstallation.update({
        where: { id: installationId },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokeReason: "User initiated revocation",
        },
      });

      // Revoke all active tokens for this installation
      await tx.revclawAccessToken.updateMany({
        where: {
          installationId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // Revoke all pending exchange codes for this installation
      await tx.revclawExchangeCode.updateMany({
        where: {
          installationId,
          status: "PENDING",
        },
        data: {
          status: "REVOKED",
        },
      });
    });

    console.log("[RevClaw] Installation revoked by user", {
      installation_id: installationId,
      agent_id: installation.agentId,
      agent_name: installation.agent.name,
      user_id: authUser.id,
    });

    await emitRevclawEvent({
      type: "REVCLAW_INSTALLATION_REVOKED",
      agentId: installation.agentId,
      userId: authUser.id,
      subjectType: "RevclawInstallation",
      subjectId: installationId,
      installationId,
      initiatedBy: "user",
      data: {
        reason: "User initiated revocation",
      },
    });

    return NextResponse.json(
      {
        status: "revoked",
        message: `Successfully revoked installation for ${installation.agent.name}`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return authErrorResponse(error);
    }
    console.error("[RevClaw] Installation revocation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
