import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import { notificationMessages } from "@/lib/notifications/messages";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

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
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, payload.userId);
  } catch (error) {
    return authErrorResponse(error);
  }
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

  const now = new Date();
  const awaitingWithMissing = await prisma.purchase.findMany({
    where: {
      projectId: { in: Array.from(projectMap.keys()) },
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

  const pendingPurchases = await prisma.purchase.findMany({
    where: {
      projectId: { in: Array.from(projectMap.keys()) },
      status: { in: ["PENDING", "FAILED"] },
      commissionAmount: { gt: 0 },
      coupon: { isNot: null },
      OR: [
        { commissionStatus: "READY_FOR_PAYOUT" },
        {
          commissionStatus: "AWAITING_REFUND_WINDOW",
          refundEligibleAt: { lte: now },
          creatorPaymentId: { not: null },
        },
      ],
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

    await prisma.event.create({
      data: {
        type: "TRANSFER_INITIATED",
        actorId: creator.id,
        projectId: group.projectId,
        subjectType: "Transfer",
        subjectId: transferRecord.id,
        data: {
          creatorId: creator.id,
          marketerId: group.marketerId,
          amount: group.totalAmount,
          currency: group.currency,
        },
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

      await prisma.event.create({
        data: {
          type: "TRANSFER_COMPLETED",
          actorId: creator.id,
          projectId: group.projectId,
          subjectType: "Transfer",
          subjectId: transferRecord.id,
          data: {
            transferId: transfer.id,
            marketerId: group.marketerId,
            amount: group.totalAmount,
            currency: group.currency,
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: group.marketerId,
          type: "PAYOUT_SENT",
          ...notificationMessages.payoutSent(group.totalAmount, group.currency),
          data: {
            transferRecordId: transferRecord.id,
            transferId: transfer.id,
            projectId: group.projectId,
          },
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

      await prisma.event.create({
        data: {
          type: "TRANSFER_FAILED",
          actorId: creator.id,
          projectId: group.projectId,
          subjectType: "Transfer",
          subjectId: transferRecord.id,
          data: {
            marketerId: group.marketerId,
            amount: group.totalAmount,
            currency: group.currency,
            failureReason,
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: group.marketerId,
          type: "PAYOUT_FAILED",
          ...notificationMessages.payoutFailed(failureReason),
          data: {
            transferRecordId: transferRecord.id,
            projectId: group.projectId,
          },
        },
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
