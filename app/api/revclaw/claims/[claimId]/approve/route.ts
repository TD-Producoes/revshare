import { NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitRevclawEvent } from "@/lib/revclaw/events";

export async function POST(
  _request: Request,
  context: { params: Promise<{ claimId: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { claimId } = await context.params;

    const registration = await prisma.revclawRegistration.findUnique({
      where: { claimId },
      include: { agent: { select: { id: true, name: true, status: true } } },
    });

    if (!registration) {
      return NextResponse.json({ error: "Invalid claim" }, { status: 404 });
    }

    if (registration.agent.status !== "ACTIVE") {
      return NextResponse.json({ error: "Agent not active" }, { status: 403 });
    }

    if (registration.status !== "PENDING") {
      return NextResponse.json(
        { error: `Claim is ${registration.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    if (registration.expiresAt < new Date()) {
      await prisma.revclawRegistration.update({
        where: { id: registration.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Claim expired" }, { status: 410 });
    }

    // Ensure a Prisma user exists for this auth user id
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User record not found for authenticated session" },
        { status: 400 },
      );
    }

    const scopesToGrant = registration.requestedScopes;

    const installation = await prisma.$transaction(async (tx) => {
      await tx.revclawRegistration.update({
        where: { id: registration.id },
        data: {
          status: "CLAIMED",
          claimedAt: new Date(),
          claimedByUserId: user.id,
        },
      });

      return tx.revclawInstallation.upsert({
        where: {
          agentId_userId: {
            agentId: registration.agentId,
            userId: user.id,
          },
        },
        create: {
          agentId: registration.agentId,
          userId: user.id,
          grantedScopes: scopesToGrant,
          status: "ACTIVE",
          requireApprovalForPublish: true,
          requireApprovalForApply: true,
        },
        update: {
          grantedScopes: scopesToGrant,
          status: "ACTIVE",
        },
        select: { id: true },
      });
    });

    await emitRevclawEvent({
      type: "REVCLAW_AGENT_CLAIMED",
      agentId: registration.agentId,
      userId: user.id,
      subjectType: "RevclawInstallation",
      subjectId: installation.id,
      installationId: installation.id,
      initiatedBy: "user",
      data: {
        granted_scopes: scopesToGrant,
        claim_id: claimId,
      },
    });

    // Redirect back to a friendly page
    return NextResponse.redirect(new URL("/revclaw", process.env.BASE_URL ?? "https://revshare.fast"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
