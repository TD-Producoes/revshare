import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";

/**
 * GET /api/revclaw/projects/:id/coupon-templates/pick
 *
 * Bot-safe helper endpoint: picks the best ACTIVE coupon template for a project.
 *
 * Scope: projects:read
 *
 * Query params:
 * - strategy=highest_discount (default)
 * - limit (default 3, max 10) => returns top candidates too
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:read");

    const { id: projectId } = await params;

    const url = new URL(request.url);
    const strategy = url.searchParams.get("strategy") ?? "highest_discount";
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 3) || 3, 1), 10);

    const templates = await prisma.couponTemplate.findMany({
      where: {
        projectId,
        status: "ACTIVE",
      },
      orderBy: [{ percentOff: "desc" }, { createdAt: "desc" }],
      take: Math.max(limit, 1),
      select: {
        id: true,
        name: true,
        description: true,
        percentOff: true,
        durationType: true,
        durationInMonths: true,
        startAt: true,
        endAt: true,
        maxRedemptions: true,
        allowedMarketerIds: true,
        createdAt: true,
      },
    });

    const now = new Date();

    const filtered = templates.filter((t) => {
      const allowed = Array.isArray(t.allowedMarketerIds) ? t.allowedMarketerIds : [];
      if (allowed.length > 0 && !allowed.includes(agent.userId)) return false;
      if (t.startAt && now < t.startAt) return false;
      if (t.endAt && now > t.endAt) return false;
      return true;
    });

    if (filtered.length === 0) {
      return NextResponse.json(
        {
          data: {
            picked: null,
            candidates: [],
            reason: "no_active_templates_available",
            strategy,
          },
        },
        { status: 200 },
      );
    }

    const picked = filtered[0];

    return NextResponse.json(
      {
        data: {
          picked,
          candidates: filtered.slice(0, limit),
          reason: strategy === "highest_discount" ? "highest_percent_off" : "highest_percent_off",
          strategy,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
