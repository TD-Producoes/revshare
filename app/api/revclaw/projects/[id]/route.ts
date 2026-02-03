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

const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(5000).optional().nullable(),
    category: z.string().max(80).optional().nullable(),
    website: z.string().url().max(2048).optional().nullable(),
    country: z.string().max(80).optional().nullable(),
    refundWindowDays: z.number().int().min(0).max(365).optional().nullable(),
    marketerCommissionPercent: z.number().min(0).max(100).optional().nullable(),
    platformCommissionPercent: z.number().min(0).max(100).optional().nullable(),
    visibility: z.nativeEnum(VisibilityMode).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

function normalizePercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value > 1) return value / 100;
  return value;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:draft_write");

    const { id } = await context.params;

    const existing = await prisma.project.findUnique({
      where: { id },
      select: { id: true, userId: true, visibility: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existing.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = await request.json().catch(() => null);
    const parsed = updateProjectSchema.safeParse(raw ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description === null ? null : input.description,
        category: input.category === null ? null : input.category,
        website: input.website === null ? null : input.website,
        country: input.country === null ? null : input.country,
        refundWindowDays:
          input.refundWindowDays === null ? null : input.refundWindowDays,
        marketerCommissionPercent:
          input.marketerCommissionPercent === undefined
            ? undefined
            : normalizePercent(input.marketerCommissionPercent),
        platformCommissionPercent:
          input.platformCommissionPercent === undefined
            ? undefined
            : normalizePercent(input.platformCommissionPercent),
        visibility: input.visibility,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        visibility: true,
        updatedAt: true,
      },
    });

    await emitRevclawEvent({
      type: EventType.PROJECT_UPDATED,
      agentId: agent.agentId,
      userId: agent.userId,
      projectId: updated.id,
      subjectType: "Project",
      subjectId: updated.id,
      installationId: agent.installationId,
      initiatedBy: "agent",
      data: {
        projectId: updated.id,
        visibility: updated.visibility,
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
