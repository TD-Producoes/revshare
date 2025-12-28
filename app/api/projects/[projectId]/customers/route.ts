import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const customerInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const parsed = customerInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      creatorStripeAccountId: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Creator Stripe account not set" },
      { status: 400 },
    );
  }

  const stripe = platformStripe();
  const stripeAccount = project.creatorStripeAccountId;

  const customer = await stripe.customers.create(
    {
      email: parsed.data.email,
      name: parsed.data.name,
    },
    { stripeAccount },
  );

  return NextResponse.json(
    {
      data: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    },
    { status: 201 },
  );
}
