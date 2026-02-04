import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { parseUserMetadata } from "@/lib/services/user-metadata";
import { redactMarketerData } from "@/lib/services/visibility";

function scoreMarketer(params: {
  projectCategory?: string | null;
  marketerSpecialties: string[];
  marketerFocusArea?: string | null;
}) {
  const category = (params.projectCategory ?? "").trim().toLowerCase();
  if (!category) return 0;

  const specialties = (params.marketerSpecialties ?? []).map((s) => s.toLowerCase());
  const focus = (params.marketerFocusArea ?? "").toLowerCase();

  let score = 0;
  if (specialties.some((s) => s.includes(category) || category.includes(s))) score += 3;
  if (focus && (focus.includes(category) || category.includes(focus))) score += 2;
  return score;
}

/**
 * GET /api/revclaw/projects/:id/marketers/recommendations
 *
 * Returns marketers recommended for a project (based on matching category to marketer specialties/focus area).
 * Auth: RevClaw access token (founder installation)
 * Scope: marketers:read
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "marketers:read");

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)));

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, name: true, category: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const marketers = await prisma.user.findMany({
      where: {
        role: "marketer",
        visibility: { in: ["PUBLIC", "GHOST"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        metadata: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const scored = marketers
      .map((m) => {
        const meta = parseUserMetadata(m.metadata);
        const specialties = meta.specialties ?? [];
        const focusArea = meta.focusArea ?? null;

        const base = {
          id: m.id,
          name: m.name,
          email: m.email,
          bio: meta.bio ?? null,
          location: meta.location ?? null,
          specialties,
          focusArea,
          visibility: m.visibility,
          metadata: m.metadata,
          // light stats placeholders (can be expanded later)
          totalEarnings: 0,
          totalRevenue: 0,
          activeProjects: 0,
          applications: 0,
          successRate: 0,
          clicks30d: 0,
          installs30d: 0,
          purchases30d: 0,
        };

        const redacted = redactMarketerData(
          base,
          false,
        );
        if (!redacted) return null;

        return {
          marketer: redacted,
          score: scoreMarketer({
            projectCategory: project.category,
            marketerSpecialties: specialties,
            marketerFocusArea: focusArea,
          }),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json(
      {
        data: {
          project: {
            id: project.id,
            name: project.name,
            category: project.category,
          },
          recommendations: scored,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
