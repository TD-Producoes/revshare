import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const markAllSchema = z.object({
  userId: z.string().min(1),
});

export async function PATCH(request: Request) {
  const parsed = markAllSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;

  const result = await prisma.notification.updateMany({
    where: { userId, status: "UNREAD" },
    data: { status: "READ", readAt: new Date() },
  });

  return NextResponse.json({ data: { updated: result.count } });
}
