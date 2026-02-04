import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const inputSchema = z.object({
  projectId: z.string().min(1),
  counterpartyId: z.string().min(1),
});

/**
 * POST /api/chat/conversations/start
 *
 * Ensures a per-project conversation exists for (project, founder, marketer)
 * when they are connected by invitation or contract.
 */
export async function POST(request: Request) {
  try {
    const authUser = await requireAuthUser();

    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { id: true, userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isFounder = project.userId === authUser.id;

    const founderId = isFounder ? authUser.id : parsed.data.counterpartyId;
    const marketerId = isFounder ? parsed.data.counterpartyId : authUser.id;

    // Must have either invitation or approved contract
    const [invite, contract] = await Promise.all([
      prisma.projectInvitation.findFirst({
        where: {
          projectId: project.id,
          founderId,
          marketerId,
        },
        select: { id: true },
      }),
      prisma.contract.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: marketerId } },
        select: { id: true, status: true },
      }),
    ]);

    const hasRelationship = !!invite || contract?.status === "APPROVED";
    if (!hasRelationship) {
      return NextResponse.json(
        { error: "No relationship found" },
        { status: 403 },
      );
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        projectId_founderId_marketerId: {
          projectId: project.id,
          founderId,
          marketerId,
        },
      },
      create: {
        projectId: project.id,
        founderId,
        marketerId,
        createdFrom: invite ? "INVITATION" : "CONTRACT",
      },
      update: {},
      select: { id: true },
    });

    return NextResponse.json({ data: conversation }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
