import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const setupIntentInput = z.object({
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = setupIntentInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;
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

  const stripe = platformStripe();
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    usage: "off_session",
    automatic_payment_methods: { enabled: true },
    metadata: { userId: user.id },
  });

  if (!setupIntent.client_secret) {
    return NextResponse.json(
      { error: "Failed to create setup intent." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: { clientSecret: setupIntent.client_secret },
  });
}
