import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== authUser.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const [total, last30Days, marketers] = await Promise.all([
    prisma.attributionClick.count({ where: { projectId } }),
    prisma.attributionClick.count({
      where: { projectId, createdAt: { gte: since } },
    }),
    prisma.attributionClick.groupBy({
      by: ["marketerId"],
      where: { projectId },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    data: {
      total,
      last30Days,
      marketers: marketers.map((row) => ({
        marketerId: row.marketerId,
        clicks: row._count._all,
      })),
    },
  });
}
