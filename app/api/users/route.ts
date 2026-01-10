import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const userInput = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.enum(["founder", "marketer"]).optional(),
});

export async function POST(request: Request) {
  const parsed = userInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, payload.id);
  } catch (error) {
    return authErrorResponse(error);
  }
  const role = payload.role ?? "founder";
  const displayName =
    payload.name?.trim() || payload.email.split("@")[0] || "New user";

  const user = await prisma.user.upsert({
    where: { id: payload.id },
    update: {
      email: payload.email,
      name: displayName,
      role,
    },
    create: {
      id: payload.id,
      email: payload.email,
      name: displayName,
      role,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ data: user });
}
