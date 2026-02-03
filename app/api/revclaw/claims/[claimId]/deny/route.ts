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
      include: { agent: { select: { id: true, status: true } } },
    });

    if (!registration) {
      return NextResponse.json({ error: "Invalid claim" }, { status: 404 });
    }

    if (registration.expiresAt < new Date()) {
      await prisma.revclawRegistration.update({
        where: { id: registration.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Claim expired" }, { status: 410 });
    }

    if (registration.status !== "PENDING") {
      return NextResponse.json(
        { error: `Claim is ${registration.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    await prisma.revclawRegistration.update({
      where: { id: registration.id },
      data: {
        status: "REVOKED",
        claimedAt: new Date(),
        claimedByUserId: authUser.id,
      },
    });

    await emitRevclawEvent({
      type: "REVCLAW_AGENT_CLAIMED",
      agentId: registration.agentId,
      userId: authUser.id,
      subjectType: "RevclawRegistration",
      subjectId: registration.id,
      initiatedBy: "user",
      data: {
        claim_id: claimId,
        action: "deny_claim",
      },
    });

    return NextResponse.redirect(new URL("/revclaw", process.env.BASE_URL ?? "https://revshare.fast"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
