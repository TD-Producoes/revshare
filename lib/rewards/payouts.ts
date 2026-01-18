import { prisma } from "@/lib/prisma";
import { notificationMessages } from "@/lib/notifications/messages";
import { platformStripe } from "@/lib/stripe";

type RewardPayoutRow = {
  id: string;
  rewardId: string;
  rewardName: string;
  projectId: string;
  projectName: string;
  marketerId: string;
  marketerName: string;
  marketerEmail: string | null;
  marketerAccountId: string;
  amount: number;
  currency: string;
  earnedAt: Date;
  status: "UNLOCKED" | "PAID" | "CLAIMED" | "PENDING_REFUND";
};

type RewardPayoutParams = {
  creatorId: string;
  currency?: string;
  cutoff?: Date;
};

type RewardTransferParams = {
  creatorId: string;
  currency: string;
  cutoff?: Date;
};

export function calculateProcessingFee(amountOwed: number) {
  const stripePercentage = 0.029;
  const fixedFee = 30;
  const fee = (amountOwed + fixedFee) / (1 - stripePercentage) - amountOwed;
  return Math.max(0, Math.round(fee));
}

export async function fetchRewardPayoutRows(params: RewardPayoutParams) {
  const currency = params.currency ? params.currency.toUpperCase() : null;
  const earned = await prisma.rewardEarned.findMany({
    where: {
      status: "UNLOCKED",
      ...(params.cutoff ? { earnedAt: { lte: params.cutoff } } : {}),
      reward: { rewardType: "MONEY", project: { userId: params.creatorId } },
      marketer: { stripeConnectedAccountId: { not: null } },
      ...(currency
        ? {
            OR: [
              { rewardCurrency: currency },
              { rewardCurrency: null, reward: { rewardCurrency: currency } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      rewardId: true,
      rewardAmount: true,
      rewardCurrency: true,
      earnedAt: true,
      status: true,
      reward: { select: { name: true, rewardAmount: true, rewardCurrency: true } },
      project: { select: { id: true, name: true } },
      marketer: {
        select: { id: true, name: true, email: true, stripeConnectedAccountId: true },
      },
    },
    orderBy: { earnedAt: "asc" },
  });

  const rows: RewardPayoutRow[] = earned
    .map((row) => {
      const amount = row.rewardAmount ?? row.reward.rewardAmount ?? 0;
      const resolvedCurrency =
        row.rewardCurrency ?? row.reward.rewardCurrency ?? currency ?? "USD";
      const accountId = row.marketer.stripeConnectedAccountId;
      if (!amount || !resolvedCurrency || !accountId) return null;
      return {
        id: row.id,
        rewardId: row.rewardId,
        rewardName: row.reward.name ?? "Reward",
        projectId: row.project.id,
        projectName: row.project.name,
        marketerId: row.marketer.id,
        marketerName: row.marketer.name ?? "Marketer",
        marketerEmail: row.marketer.email ?? null,
        marketerAccountId: accountId,
        amount,
        currency: resolvedCurrency.toUpperCase(),
        earnedAt: row.earnedAt,
        status: row.status,
      };
    })
    .filter(Boolean) as RewardPayoutRow[];

  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  return { rows, totalAmount, currency: currency ?? null };
}

export async function createRewardTransfers(params: RewardTransferParams) {
  const { rows, totalAmount, currency } = await fetchRewardPayoutRows(params);
  if (rows.length === 0) {
    return { results: [], totalAmount, rewardCount: 0 };
  }

  const grouped = new Map<
    string,
    { marketerId: string; accountId: string; ids: string[]; amount: number }
  >();
  rows.forEach((row) => {
    const existing = grouped.get(row.marketerAccountId) ?? {
      marketerId: row.marketerId,
      accountId: row.marketerAccountId,
      ids: [],
      amount: 0,
    };
    existing.ids.push(row.id);
    existing.amount += row.amount;
    grouped.set(row.marketerAccountId, existing);
  });

  const stripe = platformStripe();
  const results: Array<{
    marketerId: string;
    rewardCount: number;
    status: "PAID" | "FAILED";
    transferId?: string;
    error?: string;
  }> = [];

  const paidEarnedIds: string[] = [];

  for (const group of grouped.values()) {
    try {
      const transfer = await stripe.transfers.create({
        amount: group.amount,
        currency: currency.toLowerCase(),
        destination: group.accountId,
        metadata: {
          creatorId: params.creatorId,
          marketerId: group.marketerId,
          rewardEarnedIds: group.ids.join(","),
        },
      });

      await prisma.rewardEarned.updateMany({
        where: { id: { in: group.ids } },
        data: {
          status: "PAID",
          paidAt: new Date(),
          rewardTransferId: transfer.id,
        },
      });
      paidEarnedIds.push(...group.ids);

      results.push({
        marketerId: group.marketerId,
        rewardCount: group.ids.length,
        status: "PAID",
        transferId: transfer.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transfer failed";
      results.push({
        marketerId: group.marketerId,
        rewardCount: group.ids.length,
        status: "FAILED",
        error: message,
      });
    }
  }

  if (paidEarnedIds.length > 0) {
    const paidRewards = await prisma.rewardEarned.findMany({
      where: { id: { in: paidEarnedIds } },
      select: {
        id: true,
        rewardId: true,
        projectId: true,
        marketerId: true,
        rewardAmount: true,
        rewardCurrency: true,
        reward: {
          select: {
            name: true,
            rewardAmount: true,
            rewardCurrency: true,
            project: { select: { name: true, userId: true } },
          },
        },
        marketer: { select: { name: true } },
      },
    });

    const events = await Promise.all(
      paidRewards.map((row) =>
        prisma.event.create({
          data: {
            type: "REWARD_PAID",
            actorId: params.creatorId,
            projectId: row.projectId,
            subjectType: "RewardEarned",
            subjectId: row.id,
            data: {
              rewardId: row.rewardId,
              rewardEarnedId: row.id,
              marketerId: row.marketerId,
              amount: row.rewardAmount ?? row.reward.rewardAmount ?? 0,
              currency:
                row.rewardCurrency ?? row.reward.rewardCurrency ?? "USD",
            },
          },
          select: { id: true },
        }),
      ),
    );

    const eventIdByRewardEarned = new Map(
      events.map((event, index) => [paidRewards[index]?.id, event.id]),
    );

    await prisma.notification.createMany({
      data: paidRewards.flatMap((row) => {
        const amount = row.rewardAmount ?? row.reward.rewardAmount ?? 0;
        const currency =
          row.rewardCurrency ?? row.reward.rewardCurrency ?? "USD";
        const rewardName = row.reward.name ?? "Reward";
        const projectName = row.reward.project?.name ?? "this project";
        const creatorId = row.reward.project?.userId;
        const marketerName = row.marketer?.name ?? "A marketer";
        const eventId = eventIdByRewardEarned.get(row.id);

        const marketerNotification = {
          userId: row.marketerId,
          ...(eventId ? { eventId } : {}),
          type: "SYSTEM" as const,
          ...notificationMessages.rewardPaidMarketer(
            rewardName,
            projectName,
            amount,
            currency,
          ),
          data: {
            rewardId: row.rewardId,
            rewardEarnedId: row.id,
            projectId: row.projectId,
            marketerId: row.marketerId,
          },
        };

        const creatorNotification = creatorId
          ? {
              userId: creatorId,
              ...(eventId ? { eventId } : {}),
              type: "SYSTEM" as const,
              ...notificationMessages.rewardPaidCreator(
                marketerName,
                rewardName,
                projectName,
                amount,
                currency,
              ),
              data: {
                rewardId: row.rewardId,
                rewardEarnedId: row.id,
                projectId: row.projectId,
                marketerId: row.marketerId,
              },
            }
          : null;

        return creatorNotification
          ? [marketerNotification, creatorNotification]
          : [marketerNotification];
      }),
    });
  }

  return { results, totalAmount, rewardCount: rows.length };
}
