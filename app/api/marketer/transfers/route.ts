import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET(_request: Request) {
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

  const transfers = await prisma.transfer.findMany({
    where: { marketerId: marketer.id },
    orderBy: { createdAt: "desc" },
    include: {
      purchases: {
        select: { project: { select: { id: true, name: true } } },
      },
    },
  });

  const totals = {
    paid: 0,
    pending: 0,
    failed: 0,
  };
  const currencies = new Set<string>();

  const transferRows = transfers.map((transfer) => {
    currencies.add(transfer.currency);
    if (transfer.status === "PAID") totals.paid += transfer.amount;
    if (transfer.status === "PENDING") totals.pending += transfer.amount;
    if (transfer.status === "FAILED") totals.failed += transfer.amount;

    const projectNames = Array.from(
      new Set(
        transfer.purchases
          .map((purchase) => purchase.project?.name)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return {
      id: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      status: transfer.status,
      stripeTransferId: transfer.stripeTransferId,
      failureReason: transfer.failureReason,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
      projects: projectNames,
    };
  });

  const currency = currencies.size === 1 ? Array.from(currencies)[0] : null;

  return NextResponse.json({
    data: {
      totals,
      currency,
      transfers: transferRows,
    },
  });
}
