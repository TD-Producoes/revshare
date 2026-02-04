import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/revclaw/installations/:id/events
 *
 * Returns audit events emitted via RevClaw for this installation.
 * Authentication: Human user (session-based)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const authUser = await requireAuthUser();
    const { id: installationId } = await params;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const installation = await prisma.revclawInstallation.findUnique({
      where: { id: installationId },
      select: { id: true, userId: true },
    });

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 });
    }

    if (installation.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = parsed.data.limit ?? 40;

    const events = await prisma.event.findMany({
      where: {
        AND: [
          // Only events that were emitted via RevClaw for THIS installation
          { data: { path: ["revclaw", "installationId"], equals: installationId } },

          // Keep results scoped to the current user context too
          { OR: [{ actorId: authUser.id }, { project: { userId: authUser.id } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
