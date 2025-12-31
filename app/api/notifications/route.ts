import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["UNREAD", "READ", "ARCHIVED"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId"),
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, status, limit } = parsed.data;

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit ?? 20,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, status: "UNREAD" },
  });

  return NextResponse.json({ data: notifications, unreadCount });
}
