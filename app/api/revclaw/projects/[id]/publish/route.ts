import { NextResponse } from "next/server";
import { z } from "zod";
import { EventType, VisibilityMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { emitRevclawEvent } from "@/lib/revclaw/events";
import { verifyIntent, markIntentExecuted } from "@/lib/revclaw/intent-auth";

const publishPayloadSchema = z.object({
  project_id: z.string().min(1),
});

/**
 * RevClaw wrapper: publish a project.
 * Default policy: requires approved intent (PROJECT_PUBLISH).
 *
 * Header:
 * - X-RevClaw-Intent-Id: <intent_id> (required when policy requires approval)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:publish");

    const { id } = await context.params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true, visibility: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check installation policy
    const installation = await prisma.revclawInstallation.findUnique({
      where: { id: agent.installationId },
      select: { requireApprovalForPublish: true },
    });

    const payloadForIntent = {
      project_id: id,
      // Include project_name to keep payload hashing stable with the intent payload
      // (intents may include a human-friendly name for approval UX).
      project_name: project.name,
    };

    let intentId: string | null = null;
    if (installation?.requireApprovalForPublish ?? true) {
      intentId = request.headers.get("X-RevClaw-Intent-Id");
      if (!intentId) {
        return NextResponse.json(
          {
            error: "Intent required for publish",
            code: "intent_required",
            message:
              'Create an intent via POST /api/revclaw/intents with kind="PROJECT_PUBLISH" first, then provide X-RevClaw-Intent-Id.',
          },
          { status: 403 },
        );
      }

      const verified = await verifyIntent(
        intentId,
        agent.installationId,
        "PROJECT_PUBLISH",
        payloadForIntent,
      );

      if (!verified.valid) {
        return NextResponse.json(
          { error: verified.error, code: verified.code },
          { status: 403 },
        );
      }
    }

    // Publish = make it visible
    const updated = await prisma.project.update({
      where: { id },
      data: { visibility: VisibilityMode.PUBLIC },
      select: { id: true, visibility: true, updatedAt: true },
    });

    // Mark intent executed (single-use)
    if (intentId) {
      await markIntentExecuted(intentId, { success: true });
    }

    await emitRevclawEvent({
      type: EventType.PROJECT_UPDATED,
      agentId: agent.agentId,
      userId: agent.userId,
      projectId: updated.id,
      subjectType: "Project",
      subjectId: updated.id,
      installationId: agent.installationId,
      intentId: intentId ?? undefined,
      initiatedBy: "agent",
      data: {
        action: "publish",
        visibility: updated.visibility,
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
