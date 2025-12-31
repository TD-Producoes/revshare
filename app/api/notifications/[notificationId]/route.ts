import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["READ", "ARCHIVED"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { notificationId } = await params;
  const { userId, status } = parsed.data;

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notification || notification.userId !== userId) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: status ?? "READ",
      readAt: status === "ARCHIVED" ? null : new Date(),
    },
  });

  return NextResponse.json({ data: updated });
}
