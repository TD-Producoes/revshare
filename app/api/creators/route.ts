import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const creatorInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  stripeConnectedAccountId: z.string().min(1).optional(),
});

export async function GET() {
  const creators = await prisma.user.findMany({
    where: { role: "creator" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: creators });
}

export async function POST(request: Request) {
  const parsed = creatorInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const creator = await prisma.user.create({
    data: {
      ...parsed.data,
      role: "creator",
    },
  });

  return NextResponse.json({ data: creator }, { status: 201 });
}
