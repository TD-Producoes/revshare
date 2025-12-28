import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const marketerInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  stripeConnectedAccountId: z.string().min(1).optional(),
});

export async function GET() {
  const marketers = await prisma.user.findMany({
    where: { role: "marketer" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: marketers });
}

export async function POST(request: Request) {
  const parsed = marketerInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const marketer = await prisma.user.create({
    data: {
      ...parsed.data,
      role: "marketer",
    },
  });

  return NextResponse.json({ data: marketer }, { status: 201 });
}
