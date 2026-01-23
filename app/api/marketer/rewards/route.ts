import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET() {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const marketer = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const earned = await prisma.rewardEarned.findMany({
    where: {
      marketerId: marketer.id,
      reward: { rewardType: "MONEY" },
    },
    select: {
      id: true,
      status: true,
      earnedAt: true,
      paidAt: true,
      rewardAmount: true,
      rewardCurrency: true,
      reward: {
        select: {
          name: true,
          rewardAmount: true,
          rewardCurrency: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { earnedAt: "desc" },
  });

  const data = earned.map((row) => {
    const amount = row.rewardAmount ?? row.reward.rewardAmount ?? 0;
    const currency =
      row.rewardCurrency ?? row.reward.rewardCurrency ?? "USD";
    return {
      id: row.id,
      status: row.status,
      earnedAt: row.earnedAt,
      paidAt: row.paidAt,
      amount,
      currency,
      rewardName: row.reward.name ?? "Reward",
      projectName: row.reward.project?.name ?? "Project",
    };
  });

  return NextResponse.json({ data });
}
