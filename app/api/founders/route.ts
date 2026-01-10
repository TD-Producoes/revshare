import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const founderInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  stripeConnectedAccountId: z.string().min(1).optional(),
});

export async function GET() {
  try {
    await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const founders = await prisma.user.findMany({
    where: { role: "founder" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  return NextResponse.json({ data: founders });
}

export async function POST(request: Request) {
  const parsed = founderInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, parsed.data.id);
  } catch (error) {
    return authErrorResponse(error);
  }

  const founder = await prisma.user.create({
    data: {
      ...parsed.data,
      role: "founder",
    },
  });

  return NextResponse.json({ data: founder }, { status: 201 });
}
