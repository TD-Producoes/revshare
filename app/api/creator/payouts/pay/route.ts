import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const payInput = z.object({
  userId: z.string().min(1),
});

type PendingGroup = {
  creatorStripeAccountId: string;
  marketerAccountId: string;
  purchaseIds: string[];
  totalAmount: number;
  currency: string;
  projectId: string;
  marketerId: string;
};

export async function POST(request: Request) {
  const parsed = payInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const creator = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: creator.id },
    select: { id: true, creatorStripeAccountId: true },
  });
  const projectMap = new Map(
    projects
      .filter((project) => Boolean(project.creatorStripeAccountId))
      .map((project) => [project.id, project.creatorStripeAccountId!]),
  );

  if (projectMap.size === 0) {
    return NextResponse.json(
      { error: "Creator Stripe account not connected." },
      { status: 400 },
    );
  }

  const pendingPurchases = await prisma.purchase.findMany({
    where: {
      projectId: { in: Array.from(projectMap.keys()) },
      commissionStatus: "READY_FOR_PAYOUT",
      status: { in: ["PENDING", "FAILED"] },
      commissionAmount: { gt: 0 },
      coupon: { isNot: null },
    },
    include: {
      coupon: {
        include: { marketer: true },
      },
    },
  });

  const grouped = new Map<string, PendingGroup>();
  for (const purchase of pendingPurchases) {
    const creatorStripeAccountId = projectMap.get(purchase.projectId);
    const marketerAccountId =
      purchase.coupon?.marketer?.stripeConnectedAccountId ?? null;

    if (!creatorStripeAccountId || !marketerAccountId) {
      continue;
    }

    const key = `${creatorStripeAccountId}:${marketerAccountId}:${purchase.currency}`;
    const existing = grouped.get(key) ?? {
      creatorStripeAccountId,
      marketerAccountId,
      purchaseIds: [],
      totalAmount: 0,
      currency: purchase.currency,
      projectId: purchase.projectId,
      marketerId: purchase.coupon?.marketer?.id ?? "",
    };

    existing.purchaseIds.push(purchase.id);
    existing.totalAmount += purchase.commissionAmount;
    grouped.set(key, existing);
  }

  const stripe = platformStripe();
  const results: Array<{
    marketerAccountId: string;
    purchaseCount: number;
    transferId?: string;
    status: "PAID" | "FAILED";
    error?: string;
  }> = [];

  for (const group of grouped.values()) {
    const transferRecord = await prisma.transfer.create({
      data: {
        creatorId: creator.id,
        marketerId: group.marketerId,
        amount: group.totalAmount,
        currency: group.currency,
        status: "PENDING",
      },
    });

    try {
      const transfer = await stripe.transfers.create(
        {
          amount: group.totalAmount,
          currency: group.currency,
          destination: group.marketerAccountId,
          metadata: {
            marketerId: group.marketerId,
            projectId: group.projectId,
            purchaseIds: group.purchaseIds.join(","),
            transferRecordId: transferRecord.id,
          },
        },
        { stripeAccount: group.creatorStripeAccountId },
      );

      await prisma.transfer.update({
        where: { id: transferRecord.id },
        data: {
          status: "PAID",
          stripeTransferId: transfer.id,
          failureReason: null,
        },
      });

      await prisma.purchase.updateMany({
        where: { id: { in: group.purchaseIds } },
        data: {
          transferId: transfer.id,
          transferRecordId: transferRecord.id,
          commissionStatus: "PAID",
          status: "PAID",
        },
      });

      results.push({
        marketerAccountId: group.marketerAccountId,
        purchaseCount: group.purchaseIds.length,
        transferId: transfer.id,
        status: "PAID",
      });
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : "Transfer failed";

      await prisma.transfer.update({
        where: { id: transferRecord.id },
        data: { status: "FAILED", failureReason },
      });

      await prisma.purchase.updateMany({
        where: { id: { in: group.purchaseIds } },
        data: { status: "FAILED", transferRecordId: transferRecord.id },
      });

      results.push({
        marketerAccountId: group.marketerAccountId,
        purchaseCount: group.purchaseIds.length,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Transfer failed",
      });
    }
  }

  return NextResponse.json({ data: { results } });
}
