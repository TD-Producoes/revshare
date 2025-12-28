import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      creatorStripeAccountId: true,
      name: true,
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

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const createdRange: { gte?: number; lte?: number } = {};

  const parseUnix = (value: string | null) => {
    if (!value) return null;
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return null;
    return Math.floor(timestamp / 1000);
  };

  const fromUnix = parseUnix(from);
  const toUnix = parseUnix(to);
  if (fromUnix) createdRange.gte = fromUnix;
  if (toUnix) createdRange.lte = toUnix;

  const [charges, customers, purchaseTotals, couponTotals] = await Promise.all([
    stripe.charges.list(
      {
        limit: 100,
        ...(fromUnix || toUnix ? { created: createdRange } : {}),
      },
      { stripeAccount },
    ),
    stripe.customers.list(
      {
        limit: 100,
        ...(fromUnix || toUnix ? { created: createdRange } : {}),
      },
      { stripeAccount },
    ),
    prisma.purchase.aggregate({
      where: { projectId },
      _sum: { amount: true, commissionAmount: true },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: { projectId, couponId: { not: null } },
      _sum: { amount: true, commissionAmount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = charges.data.reduce((sum, charge) => {
    if (charge.paid && !charge.refunded) {
      return sum + charge.amount;
    }
    return sum;
  }, 0);

  return NextResponse.json({
    data: {
      projectName: project.name,
      stripe: {
        totalRevenue,
        charges: charges.data.length,
        newCustomers: customers.data.length,
      },
      platform: {
        totalTrackedRevenue: purchaseTotals._sum.amount ?? 0,
        totalCommission: purchaseTotals._sum.commissionAmount ?? 0,
        purchases: purchaseTotals._count,
      },
      coupons: {
        revenue: couponTotals._sum.amount ?? 0,
        commission: couponTotals._sum.commissionAmount ?? 0,
        purchases: couponTotals._count,
      },
    },
  });
}
