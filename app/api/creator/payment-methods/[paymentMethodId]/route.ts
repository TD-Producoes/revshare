import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const removeInput = z.object({
  userId: z.string().min(1),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ paymentMethodId: string }> },
) {
  const { paymentMethodId } = await params;
  const parsed = removeInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  if (user.stripeCustomerId) {
    const stripe = platformStripe();
    try {
      await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to detach payment method.",
        },
        { status: 400 },
      );
    }
  }

  await prisma.paymentMethod.delete({
    where: { id: paymentMethod.id },
  });

  const fallback = await prisma.paymentMethod.findFirst({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  if (user.stripeCustomerId) {
    const stripe = platformStripe();
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: fallback?.stripePaymentMethodId ?? null,
      },
    });
  }

  if (fallback && !fallback.isDefault) {
    await prisma.paymentMethod.update({
      where: { id: fallback.id },
      data: { isDefault: true },
    });
  }

  return NextResponse.json({ data: { success: true } });
}
