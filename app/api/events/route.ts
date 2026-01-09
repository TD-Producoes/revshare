import { NextResponse } from "next/server";
import { z } from "zod";
import { EventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  role: z.enum(["creator", "marketer"]).optional(),
  projectId: z.string().min(1).optional(),
  actor: z.string().min(1).optional(),
  eventType: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
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
      { status: 400 }
    );
  }

  const { role, projectId, actor, eventType } = parsed.data;
  const userId = authUser.id;
  const pageSize = parsed.data.pageSize ?? 20;
  const page = parsed.data.page ?? 1;

  // Build where clause conditionally with explicit typing
  // Start with base conditions
  const whereConditions: Prisma.EventWhereInput = {};

  // Add projectId filter if provided
  if (projectId) {
    whereConditions.projectId = projectId;
  }

  // Add eventType filter if provided
  if (eventType) {
    whereConditions.type = eventType as EventType;
  }

  // Add actor filter if provided
  if (actor) {
    whereConditions.actor = {
      OR: [
        { name: { contains: actor, mode: "insensitive" as const } },
        { email: { contains: actor, mode: "insensitive" as const } },
      ],
    };
  }

  // Add role-based OR conditions
  if (role === "creator") {
    whereConditions.OR = [{ actorId: userId }, { project: { userId } }];
  } else if (role === "marketer") {
    whereConditions.OR = [
      { actorId: userId },
      { subjectId: userId },
      { data: { path: ["marketerId"], equals: userId } },
    ];
  } else {
    whereConditions.OR = [{ actorId: userId }, { subjectId: userId }];
  }

  const where = whereConditions;

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
