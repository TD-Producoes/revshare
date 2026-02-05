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

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  website: z.string().url().max(2048).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  refundWindowDays: z.number().int().min(0).max(365).optional().nullable(),
  // Commission percents are stored as decimals (0.2 means 20%). Accept either 0..1 or 0..100.
  marketerCommissionPercent: z.number().min(0).max(100).optional().nullable(),
  platformCommissionPercent: z.number().min(0).max(100).optional().nullable(),
  visibility: z.nativeEnum(VisibilityMode).optional().nullable(),
});

function normalizePercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value > 1) return value / 100;
  return value;
}

/**
 * GET /api/revclaw/projects
 *
 * Marketer-bot discovery endpoint.
 * Returns PUBLIC projects that a marketer could apply to.
 *
 * Scope: projects:read
 * Query params:
 * - category (optional)
 * - limit (optional, default 20, max 50)
 */
export async function GET(request: Request) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:read");

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1),
      50,
    );

    const projects = await prisma.project.findMany({
      where: {
        visibility: VisibilityMode.PUBLIC,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        website: true,
        description: true,
        marketerCommissionPercent: true,
        refundWindowDays: true,
      },
    });

    return NextResponse.json({ data: projects }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}

/**
 * RevClaw wrapper: create a project in "draft" state.
 *
 * We model "draft" as visibility=PRIVATE by default.
 */
export async function POST(request: Request) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:draft_write");

    const raw = await request.json().catch(() => null);
    const parsed = createProjectSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const project = await prisma.project.create({
      data: {
        userId: agent.userId,
        name: input.name,
        description: input.description ?? undefined,
        category: input.category ?? undefined,
        website: input.website ?? undefined,
        country: input.country ?? undefined,
        refundWindowDays: input.refundWindowDays ?? undefined,
        marketerCommissionPercent:
          normalizePercent(input.marketerCommissionPercent) ?? undefined,
        platformCommissionPercent:
          normalizePercent(input.platformCommissionPercent) ?? undefined,
        // Draft by default
        visibility: input.visibility ?? VisibilityMode.PRIVATE,
        // keep defaults for the rest
      },
      select: {
        id: true,
        userId: true,
        name: true,
        visibility: true,
        createdAt: true,
      },
    });

    await emitRevclawEvent({
      type: EventType.PROJECT_CREATED,
      agentId: agent.agentId,
      userId: agent.userId,
      projectId: project.id,
      subjectType: "Project",
      subjectId: project.id,
      installationId: agent.installationId,
      initiatedBy: "agent",
      data: {
        projectId: project.id,
        name: project.name,
        visibility: project.visibility,
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
