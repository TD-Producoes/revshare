import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const defaultInput = z.object({
  userId: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ paymentMethodId: string }> },
) {
  const { paymentMethodId } = await params;
  const parsed = defaultInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
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
