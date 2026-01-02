import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["creator", "marketer"]).optional(),
  projectId: z.string().min(1).optional(),
  actor: z.string().min(1).optional(),
  eventType: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId"),
    role: searchParams.get("role") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
    actor: searchParams.get("actor") ?? undefined,
    eventType: searchParams.get("eventType") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, role, projectId, actor, eventType } = parsed.data;
  const pageSize = parsed.data.pageSize ?? 20;
  const page = parsed.data.page ?? 1;

  const actorFilter = actor
    ? {
        actor: {
          OR: [
            { name: { contains: actor, mode: "insensitive" } },
            { email: { contains: actor, mode: "insensitive" } },
          ],
        },
      }
    : {};

  const where =
    role === "creator"
      ? {
          OR: [{ actorId: userId }, { project: { userId } }],
          ...(projectId ? { projectId } : {}),
          ...(eventType ? { type: eventType } : {}),
          ...actorFilter,
        }
      : role === "marketer"
        ? {
            OR: [
              { actorId: userId },
              { subjectId: userId },
              { data: { path: ["marketerId"], equals: userId } },
            ],
            ...(projectId ? { projectId } : {}),
            ...(eventType ? { type: eventType } : {}),
            ...actorFilter,
          }
        : {
            OR: [{ actorId: userId }, { subjectId: userId }],
            ...(projectId ? { projectId } : {}),
            ...(eventType ? { type: eventType } : {}),
            ...actorFilter,
          };

  const [events, totalCount] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({
    data: events,
    totalCount,
    page,
    pageSize,
  });
}
