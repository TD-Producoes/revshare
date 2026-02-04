import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const schema = z.object({
  commissionPercent: z.number().min(0).max(100),
  refundWindowDays: z.number().int().min(0).max(365),
});

/**
 * POST /api/founder/invitations/:id/update-terms
 *
 * Founder can update commission/refund window for a PENDING invitation.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await params;

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        founderId: true,
        marketerId: true,
        status: true,
        commissionPercentSnapshot: true,
        refundWindowDaysSnapshot: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.founderId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending invitations can be updated" },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedInvitation = await tx.projectInvitation.update({
        where: { id },
        data: {
          commissionPercentSnapshot: parsed.data.commissionPercent / 100,
          refundWindowDaysSnapshot: parsed.data.refundWindowDays,
        },
        select: {
          id: true,
          status: true,
          commissionPercentSnapshot: true,
          refundWindowDaysSnapshot: true,
          updatedAt: true,
        },
      });

      // Canonical chat: append an automatic message into the per-project conversation.
      const conv = await tx.conversation.upsert({
        where: {
          projectId_founderId_marketerId: {
            projectId: invitation.projectId,
            founderId: invitation.founderId,
            marketerId: invitation.marketerId,
          },
        },
        create: {
          projectId: invitation.projectId,
          founderId: invitation.founderId,
          marketerId: invitation.marketerId,
          createdFrom: "INVITATION",
        },
        update: {},
        select: { id: true },
      });

      const body = `Updated invitation terms: commission ${parsed.data.commissionPercent}% · refund window ${parsed.data.refundWindowDays} days.`;

      const msg = await tx.conversationMessage.create({
        data: {
          conversationId: conv.id,
          senderUserId: authUser.id,
          body,
        },
        select: { createdAt: true },
      });

      await tx.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: msg.createdAt },
      });

      return updatedInvitation;
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
