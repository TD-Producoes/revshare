import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const listInput = z.object({
  userId: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listInput.safeParse({
    userId: searchParams.get("userId"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, parsed.data.userId);
  } catch (error) {
    return authErrorResponse(error);
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId: parsed.data.userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      stripePaymentMethodId: true,
      type: true,
      brand: true,
      last4: true,
      expMonth: true,
      expYear: true,
      bankName: true,
      isDefault: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: paymentMethods });
}
