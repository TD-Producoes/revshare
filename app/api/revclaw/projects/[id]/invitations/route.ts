import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";
import { withIntentEnforcement } from "@/lib/revclaw/intent-enforcement";

const bodySchema = z.object({
  marketerId: z.string().min(1),
  message: z.string().min(1).max(5000),
  commissionPercent: z.number().min(0).max(100).optional().nullable(),
  refundWindowDays: z.number().int().min(0).max(365).optional().nullable(),
});

type RouteParams = { id: string };

async function extractPayloadForVerification(request: NextRequest, routeContext: { params: Promise<RouteParams> }) {
  const { id: projectId } = await routeContext.params;
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    // Return raw so enforcement fails with payload mismatch rather than crashing.
    return { project_id: projectId, invalid: true };
  }

  const input = parsed.data;

  return {
    project_id: projectId,
    marketer_id: input.marketerId,
    message: input.message,
    commissionPercent: input.commissionPercent ?? null,
    refundWindowDays: input.refundWindowDays ?? null,
  };
}

/**
 * POST /api/revclaw/projects/:id/invitations
 *
 * Create a founder->marketer invitation for a project.
 *
 * Auth: RevClaw access token
 * Scope: projects:draft_write
 * Approval: requires intent kind PROJECT_INVITATION_CREATE by default
 */
export const POST = withIntentEnforcement<RouteParams>(
  "PROJECT_INVITATION_CREATE",
  async (request: NextRequest, { params }, _enforcement) => {
    try {
      const agent = await authenticateAgent(request);
      requireScope(agent, "projects:draft_write");

      const { id: projectId } = await params;

      const raw = await request.json().catch(() => null);
      const parsed = bodySchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const input = parsed.data;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          userId: true,
          name: true,
          marketerCommissionPercent: true,
          refundWindowDays: true,
        },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      if (project.userId !== agent.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const marketer = await prisma.user.findUnique({
        where: { id: input.marketerId },
        select: { id: true, role: true, name: true, email: true },
      });

      if (!marketer || marketer.role !== "marketer") {
        return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
      }

      const commissionPercent =
        typeof input.commissionPercent === "number"
          ? input.commissionPercent
          : Number(project.marketerCommissionPercent) * 100;

      const refundWindowDays =
        typeof input.refundWindowDays === "number"
          ? input.refundWindowDays
          : project.refundWindowDays ?? 30;

      // Do not allow inviting a marketer that already has a contract for this project
      const existingContract = await prisma.contract.findUnique({
        where: { projectId_userId: { projectId, userId: input.marketerId } },
        select: { id: true },
      });
      if (existingContract) {
        return NextResponse.json(
          { error: "Marketer already has a contract for this project", code: "already_contracted" },
          { status: 409 },
        );
      }

      // Prevent duplicate pending invitation
      const existingPending = await prisma.projectInvitation.findFirst({
        where: {
          projectId,
          marketerId: input.marketerId,
          status: "PENDING",
        },
        select: { id: true },
      });
      if (existingPending) {
        return NextResponse.json(
          { error: "Invitation already pending", invitationId: existingPending.id },
          { status: 409 },
        );
      }

      const created = await prisma.$transaction(async (tx) => {
        const inv = await tx.projectInvitation.create({
          data: {
            projectId,
            founderId: agent.userId,
            marketerId: input.marketerId,
            status: "PENDING",
            message: input.message,
            commissionPercentSnapshot: commissionPercent / 100,
            refundWindowDaysSnapshot: refundWindowDays,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            commissionPercentSnapshot: true,
            refundWindowDaysSnapshot: true,
          },
        });

        // Canonical conversation: store the invite as the first message.
        const conv = await tx.conversation.upsert({
          where: {
            projectId_founderId_marketerId: {
              projectId,
              founderId: agent.userId,
              marketerId: input.marketerId,
            },
          },
          create: {
            projectId,
            founderId: agent.userId,
            marketerId: input.marketerId,
            createdFrom: "INVITATION",
          },
          update: {},
          select: { id: true },
        });

        const msg = await tx.conversationMessage.create({
          data: {
            conversationId: conv.id,
            senderUserId: agent.userId,
            body: input.message,
          },
          select: { id: true, createdAt: true },
        });

        await tx.conversation.update({
          where: { id: conv.id },
          data: { lastMessageAt: msg.createdAt },
        });

        return { invitation: inv, conversationId: conv.id };
      });

      return NextResponse.json(
        {
          data: {
            invitation_id: created.invitation.id,
            status: created.invitation.status,
            conversation_id: created.conversationId,
          },
        },
        { status: 201 },
      );
    } catch (err) {
      return authErrorResponse(err);
    }
  },
  extractPayloadForVerification,
);
