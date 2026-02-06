import { NextResponse } from "next/server";
import { z } from "zod";

import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRewardTransfers,
  fetchBlockedRewardPayoutRows,
  fetchRewardPayoutRows,
} from "@/lib/rewards/payouts";

const payoutInput = z.object({
  currency: z.string().min(1),
});

type RewardPayoutRow = {
  id: string;
  rewardId: string;
  rewardName: string;
  projectId: string;
  projectName: string;
  marketerId: string;
  marketerName: string;
  marketerEmail: string | null;
  amount: number;
  currency: string;
  earnedAt: Date;
  status: "UNLOCKED" | "PAID" | "CLAIMED" | "PENDING_REFUND";
};

type BlockedRewardPayoutRow = RewardPayoutRow & {
  reason: "MISSING_STRIPE_ACCOUNT";
};

const groupByCurrency = (rows: RewardPayoutRow[]) => {
  const groups = new Map<string, RewardPayoutRow[]>();
  rows.forEach((row) => {
    const currency = row.currency.toUpperCase();
    const list = groups.get(currency) ?? [];
    list.push(row);
    groups.set(currency, list);
  });
  return Array.from(groups.entries())
    .map(([currency, items]) => ({
      currency,
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      rewardCount: items.length,
      items,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
};

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
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const { rows } = await fetchRewardPayoutRows({
    creatorId: userId,
  });
  const { rows: blockedRows } = await fetchBlockedRewardPayoutRows({
    creatorId: userId,
  });

  const rowsForResponse: RewardPayoutRow[] = rows.map((row) => ({
    id: row.id,
    rewardId: row.rewardId,
    rewardName: row.rewardName,
    projectId: row.projectId,
    projectName: row.projectName,
    marketerId: row.marketerId,
    marketerName: row.marketerName,
    marketerEmail: row.marketerEmail,
    amount: row.amount,
    currency: row.currency,
    earnedAt: row.earnedAt,
    status: row.status,
  }));
  const blockedRowsForResponse: BlockedRewardPayoutRow[] = blockedRows.map(
    (row) => ({
      id: row.id,
      rewardId: row.rewardId,
      rewardName: row.rewardName,
      projectId: row.projectId,
      projectName: row.projectName,
      marketerId: row.marketerId,
      marketerName: row.marketerName,
      marketerEmail: row.marketerEmail,
      amount: row.amount,
      currency: row.currency,
      earnedAt: row.earnedAt,
      status: row.status,
      reason: row.reason,
    }),
  );

  return NextResponse.json({
    data: {
      groups: groupByCurrency(rowsForResponse),
      blockedGroups: groupByCurrency(blockedRowsForResponse),
      blockedCount: blockedRowsForResponse.length,
    },
  });
}

export async function POST(request: Request) {
  const parsed = payoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const creator = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const currency = parsed.data.currency.toUpperCase();
  const { results } = await createRewardTransfers({
    creatorId: creator.id,
    currency,
  });

  return NextResponse.json({ data: { results } });
}
