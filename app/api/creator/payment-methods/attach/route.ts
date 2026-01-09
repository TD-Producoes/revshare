import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const attachInput = z.object({
  userId: z.string().min(1),
  setupIntentId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = attachInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, setupIntentId } = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, userId);
  } catch (error) {
    return authErrorResponse(error);
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Stripe customer not found." },
      { status: 400 },
    );
  }

  const stripe = platformStripe();
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
    expand: ["payment_method"],
  });

  if (
    setupIntent.customer &&
    setupIntent.customer !== user.stripeCustomerId
  ) {
    return NextResponse.json(
      { error: "Payment method does not belong to this customer." },
      { status: 400 },
    );
  }

  if (setupIntent.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment method setup is not complete." },
      { status: 400 },
    );
  }

  const paymentMethod =
    typeof setupIntent.payment_method === "string"
      ? await stripe.paymentMethods.retrieve(setupIntent.payment_method)
      : setupIntent.payment_method;

  if (!paymentMethod || typeof paymentMethod === "string") {
    return NextResponse.json(
      { error: "Payment method not available." },
      { status: 400 },
    );
  }

  if (paymentMethod.customer !== user.stripeCustomerId) {
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: user.stripeCustomerId,
    });
  }

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  const existingPaymentMethod = await prisma.paymentMethod.findUnique({
    where: { stripePaymentMethodId: paymentMethod.id },
  });

  if (existingPaymentMethod && existingPaymentMethod.userId !== user.id) {
    return NextResponse.json(
      { error: "Payment method already associated with another user." },
      { status: 400 },
    );
  }

  const paymentMethodData: {
    type: string;
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
    bankName: string | null;
  } = {
    type: paymentMethod.type,
    brand: null,
    last4: null,
    expMonth: null,
    expYear: null,
    bankName: null,
  };

  if (paymentMethod.type === "card" && paymentMethod.card) {
    paymentMethodData.brand = paymentMethod.card.brand ?? null;
    paymentMethodData.last4 = paymentMethod.card.last4 ?? null;
    paymentMethodData.expMonth = paymentMethod.card.exp_month ?? null;
    paymentMethodData.expYear = paymentMethod.card.exp_year ?? null;
  }

  if (paymentMethod.type === "us_bank_account" && paymentMethod.us_bank_account) {
    paymentMethodData.bankName =
      paymentMethod.us_bank_account.bank_name ?? null;
    paymentMethodData.last4 = paymentMethod.us_bank_account.last4 ?? null;
  }

  const [updatedPaymentMethod] = await prisma.$transaction([
    prisma.paymentMethod.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId: paymentMethod.id },
      update: {
        ...paymentMethodData,
        isDefault: true,
      },
      create: {
        userId: user.id,
        stripePaymentMethodId: paymentMethod.id,
        isDefault: true,
        ...paymentMethodData,
      },
      select: {
        id: true,
        userId: true,
        stripePaymentMethodId: true,
        type: true,
        brand: true,
        last4: true,
        expMonth: true,
        expYear: true,
        bankName: true,
        isDefault: true,
      },
    }),
  ]);

  return NextResponse.json({ data: updatedPaymentMethod });
}
