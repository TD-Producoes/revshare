import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";
import { notificationMessages } from "@/lib/notifications/messages";

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
  adjustmentIds: string[];
  adjustmentTotal: number;
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
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, creatorId);
  } catch (error) {
    return authErrorResponse(error);
  }
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

  const adjustments = await prisma.commissionAdjustment.findMany({
    where: {
      creatorId,
      status: "PENDING",
    },
    select: {
      id: true,
      marketerId: true,
      currency: true,
      amount: true,
      marketer: { select: { stripeConnectedAccountId: true } },
    },
  });

  const adjustmentsByKey = new Map<
    string,
    { ids: string[]; total: number; marketerId: string }
  >();
  for (const adjustment of adjustments) {
    const marketerAccountId = adjustment.marketer?.stripeConnectedAccountId ?? null;
    if (!marketerAccountId) {
      continue;
    }
    const key = `${marketerAccountId}:${adjustment.currency}`;
    const existing = adjustmentsByKey.get(key) ?? {
      ids: [],
      total: 0,
      marketerId: adjustment.marketerId,
    };
    existing.ids.push(adjustment.id);
    existing.total += adjustment.amount;
    adjustmentsByKey.set(key, existing);
  }

  const grouped = new Map<string, ReadyGroup>();
  for (const purchase of purchases) {
    const marketerAccountId =
      purchase.coupon?.marketer?.stripeConnectedAccountId ?? null;
    if (!marketerAccountId) {
      continue;
    }
    const key = `${marketerAccountId}:${purchase.currency}`;
    const adjustment = adjustmentsByKey.get(key);
    const existing = grouped.get(key) ?? {
      marketerAccountId,
      purchaseIds: [],
      totalAmount: 0,
      currency: purchase.currency,
      marketerId: purchase.coupon?.marketer?.id ?? "",
      projectId: purchase.projectId,
      adjustmentIds: adjustment?.ids ?? [],
      adjustmentTotal: adjustment?.total ?? 0,
    };
    existing.purchaseIds.push(purchase.id);
    existing.totalAmount += purchase.commissionAmount;
    if (!existing.adjustmentIds.length && adjustment?.ids?.length) {
      existing.adjustmentIds = adjustment.ids;
      existing.adjustmentTotal = adjustment.total;
    }
    grouped.set(key, existing);
  }

  const stripe = platformStripe();
  const results: Array<{
    marketerAccountId: string;
    marketerId: string;
    purchaseCount: number;
    transferId?: string;
    status: "PAID" | "FAILED" | "SKIPPED";
    error?: string;
  }> = [];

  for (const group of grouped.values()) {
    const netAmount = group.totalAmount + group.adjustmentTotal;
    if (netAmount <= 0) {
      results.push({
        marketerAccountId: group.marketerAccountId,
        marketerId: group.marketerId,
        purchaseCount: group.purchaseIds.length,
        status: "SKIPPED",
        error:
          "Net payout is zero after applying commission adjustments. Awaiting future commissions.",
      });
      continue;
    }
    const transferRecord = await prisma.transfer.create({
      data: {
        creatorId,
        marketerId: group.marketerId,
        amount: netAmount,
        currency: group.currency,
        status: "PENDING",
      },
    });

    try {
      const transfer = await stripe.transfers.create({
        amount: netAmount,
        currency: group.currency,
        destination: group.marketerAccountId,
        metadata: {
          creatorId,
          marketerId: group.marketerId,
          projectId: group.projectId,
          purchaseIds: group.purchaseIds.join(","),
          transferRecordId: transferRecord.id,
          adjustmentIds: group.adjustmentIds.join(","),
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

      if (group.adjustmentIds.length > 0) {
        await prisma.commissionAdjustment.updateMany({
          where: { id: { in: group.adjustmentIds } },
          data: { status: "APPLIED" },
        });
      }

      await prisma.purchase.updateMany({
        where: { id: { in: group.purchaseIds } },
        data: {
          transferId: transfer.id,
          transferRecordId: transferRecord.id,
          commissionStatus: "PAID",
          status: "PAID",
        },
      });

      await prisma.event.create({
        data: {
          type: "TRANSFER_COMPLETED",
          actorId: creatorId,
          projectId: group.projectId,
          subjectType: "Transfer",
          subjectId: transferRecord.id,
          data: {
            creatorId,
            marketerId: group.marketerId,
            transferId: transfer.id,
            amount: netAmount,
            currency: group.currency,
            purchaseIds: group.purchaseIds,
            adjustmentIds: group.adjustmentIds,
          },
        },
      });

      await prisma.notification.createMany({
        data: [
          {
            userId: creatorId,
            type: "SYSTEM",
            ...notificationMessages.transferSentCreator(netAmount, group.currency),
            data: {
              transferId: transfer.id,
              transferRecordId: transferRecord.id,
              marketerId: group.marketerId,
              projectId: group.projectId,
            },
          },
          {
            userId: group.marketerId,
            type: "SYSTEM",
            ...notificationMessages.transferSentMarketer(netAmount, group.currency),
            data: {
              transferId: transfer.id,
              transferRecordId: transferRecord.id,
              creatorId,
              projectId: group.projectId,
            },
          },
        ],
      });

      results.push({
        marketerAccountId: group.marketerAccountId,
        marketerId: group.marketerId,
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
        marketerId: group.marketerId,
        purchaseCount: group.purchaseIds.length,
        status: "FAILED",
        error: failureReason,
      });
    }
  }

  return NextResponse.json({ data: { results } });
}
