import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId: authUser.id },
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
