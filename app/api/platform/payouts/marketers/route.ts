import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const payoutInput = z.object({
  creatorId: z.string().min(1),
});

type ReadyGroup = {
  marketerAccountId: string;
  purchaseIds: string[];
  totalAmount: number;
  currency: string;
  marketerId: string;
  projectId: string;
};

export async function POST(request: Request) {
  const parsed = payoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { creatorId } = parsed.data;
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const now = new Date();
  const awaitingWithMissing = await prisma.purchase.findMany({
    where: {
      project: { userId: creatorId },
      commissionStatus: "AWAITING_REFUND_WINDOW",
      refundEligibleAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      refundWindowDays: true,
      creatorPaymentId: true,
      project: { select: { refundWindowDays: true } },
    },
  });
  if (awaitingWithMissing.length > 0) {
    await Promise.all(
      awaitingWithMissing.map((purchase) => {
        const effectiveDays =
          purchase.refundWindowDays ??
          purchase.project.refundWindowDays ??
          30;
        const refundEligibleAt = new Date(
          purchase.createdAt.getTime() + effectiveDays * 24 * 60 * 60 * 1000,
        );
        const nextStatus =
          refundEligibleAt <= now
            ? purchase.creatorPaymentId
              ? "READY_FOR_PAYOUT"
              : "PENDING_CREATOR_PAYMENT"
            : "AWAITING_REFUND_WINDOW";
        return prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            refundWindowDays: effectiveDays,
            refundEligibleAt,
            commissionStatus: nextStatus,
          },
        });
      }),
    );
  }

  const purchases = await prisma.purchase.findMany({
    where: {
      project: { userId: creatorId },
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

  if (purchases.length === 0) {
    return NextResponse.json({ data: { results: [] } });
  }

  const grouped = new Map<string, ReadyGroup>();
  for (const purchase of purchases) {
    const marketerAccountId =
      purchase.coupon?.marketer?.stripeConnectedAccountId ?? null;
    if (!marketerAccountId) {
      continue;
    }
    const key = `${marketerAccountId}:${purchase.currency}`;
    const existing = grouped.get(key) ?? {
      marketerAccountId,
      purchaseIds: [],
      totalAmount: 0,
      currency: purchase.currency,
      marketerId: purchase.coupon?.marketer?.id ?? "",
      projectId: purchase.projectId,
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
        creatorId,
        marketerId: group.marketerId,
        amount: group.totalAmount,
        currency: group.currency,
        status: "PENDING",
      },
    });

    try {
      const transfer = await stripe.transfers.create({
        amount: group.totalAmount,
        currency: group.currency,
        destination: group.marketerAccountId,
        metadata: {
          creatorId,
          marketerId: group.marketerId,
          projectId: group.projectId,
          purchaseIds: group.purchaseIds.join(","),
          transferRecordId: transferRecord.id,
        },
      });

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
        error: failureReason,
      });
    }
  }

  return NextResponse.json({ data: { results } });
}
