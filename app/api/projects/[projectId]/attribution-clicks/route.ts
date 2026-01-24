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

  const [total, last30Days, totalInstalls, last30Installs, marketers, installMarketers] =
    await Promise.all([
      prisma.attributionClick.count({
        where: {
          projectId,
          OR: [
            { deviceId: { startsWith: "click:" } },
            { NOT: { deviceId: { startsWith: "install:" } } },
          ],
        },
      }),
      prisma.attributionClick.count({
        where: {
          projectId,
          createdAt: { gte: since },
          OR: [
            { deviceId: { startsWith: "click:" } },
            { NOT: { deviceId: { startsWith: "install:" } } },
          ],
        },
      }),
      prisma.attributionClick.count({
        where: { projectId, deviceId: { startsWith: "install:" } },
      }),
      prisma.attributionClick.count({
        where: {
          projectId,
          createdAt: { gte: since },
          deviceId: { startsWith: "install:" },
        },
      }),
      prisma.attributionClick.groupBy({
        by: ["marketerId"],
        where: {
          projectId,
          OR: [
            { deviceId: { startsWith: "click:" } },
            { NOT: { deviceId: { startsWith: "install:" } } },
          ],
        },
        _count: { _all: true },
      }),
      prisma.attributionClick.groupBy({
        by: ["marketerId"],
        where: { projectId, deviceId: { startsWith: "install:" } },
        _count: { _all: true },
      }),
    ]);

  const installsByMarketer = new Map(
    installMarketers.map((row) => [row.marketerId, row._count._all]),
  );

  return NextResponse.json({
    data: {
      total,
      last30Days,
      installsTotal: totalInstalls,
      installsLast30Days: last30Installs,
      marketers: marketers.map((row) => ({
        marketerId: row.marketerId,
        clicks: row._count._all,
        installs: installsByMarketer.get(row.marketerId) ?? 0,
      })),
    },
  });
}
