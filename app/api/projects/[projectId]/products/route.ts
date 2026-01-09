import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  // Authenticate user
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      userId: true,
      creatorStripeAccountId: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== authUser.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (!project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Creator Stripe account not set" },
      { status: 400 },
    );
  }

  const stripe = platformStripe();
  const stripeAccount = project.creatorStripeAccountId;

  const [products, prices] = await Promise.all([
    stripe.products.list({ active: true, limit: 100 }, { stripeAccount }),
    stripe.prices.list({ active: true, limit: 100 }, { stripeAccount }),
  ]);

  const priceMap = new Map<string, typeof prices.data>();
  for (const price of prices.data) {
    const productId =
      typeof price.product === "string" ? price.product : price.product?.id;
    if (!productId) {
      continue;
    }
    const existing = priceMap.get(productId) ?? [];
    existing.push(price);
    priceMap.set(productId, existing);
  }

  const productData = products.data.map((product) => {
    const productPrices = priceMap.get(product.id) ?? [];

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
      prices: productPrices.map((price) => ({
        id: price.id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        type: price.type,
        nickname: price.nickname,
        active: price.active,
        recurring: price.recurring
          ? {
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count,
            }
          : null,
      })),
    };
  });

  return NextResponse.json({ data: { products: productData } });
}
