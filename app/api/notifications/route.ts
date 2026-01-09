import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const querySchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["UNREAD", "READ", "ARCHIVED"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId"),
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, status, limit, page, pageSize } = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, userId);
  } catch (error) {
    return authErrorResponse(error);
  }
  const resolvedPageSize = pageSize ?? limit ?? 20;
  const resolvedPage = page ?? 1;

  const where = {
    userId,
    ...(status ? { status } : {}),
  };

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: resolvedPageSize,
      skip: (resolvedPage - 1) * resolvedPageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, status: "UNREAD" },
    }),
  ]);

  return NextResponse.json({
    data: notifications,
    unreadCount,
    totalCount,
    page: resolvedPage,
    pageSize: resolvedPageSize,
  });
}
