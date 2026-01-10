import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ paymentMethodId: string }> },
) {
  const { paymentMethodId } = await params;

  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Stripe customer not found." },
      { status: 400 },
    );
  }

  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, userId: user.id },
  });
  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Payment method not found." },
      { status: 404 },
    );
  }

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.paymentMethod.update({
      where: { id: paymentMethod.id },
      data: { isDefault: true },
    }),
  ]);

  const stripe = platformStripe();
  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethod.stripePaymentMethodId },
  });

  return NextResponse.json({ data: { success: true } });
}
