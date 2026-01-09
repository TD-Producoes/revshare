import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (userId !== authUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const now = new Date();
  const awaitingWithMissing = await prisma.purchase.findMany({
    where: {
      project: { userId: creator.id },
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
    where: { project: { userId: creator.id } },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, platformCommissionPercent: true } },
      coupon: {
        select: {
          code: true,
          marketer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const data = purchases.map((purchase) => ({
    id: purchase.id,
    projectId: purchase.projectId,
    projectName: purchase.project.name,
    customerEmail: purchase.customerEmail,
    amount: purchase.amount,
    commissionAmount: purchase.commissionAmount,
    platformFee: Math.round(
      purchase.commissionAmount *
        (Number(purchase.project.platformCommissionPercent) || 0),
    ),
    commissionStatus: purchase.commissionStatus.toLowerCase(),
    status: purchase.status.toLowerCase(),
    createdAt: purchase.createdAt,
    refundEligibleAt: purchase.refundEligibleAt,
    couponCode: purchase.coupon?.code ?? null,
    marketer: purchase.coupon?.marketer
      ? {
          id: purchase.coupon.marketer.id,
          name: purchase.coupon.marketer.name,
          email: purchase.coupon.marketer.email,
        }
      : null,
  }));

  return NextResponse.json({ data });
}
