import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";

export const runtime = "nodejs";

function startOfDayUTC(d: Date) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function daysAgoUTC(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return startOfDayUTC(d);
}

/**
 * GET /api/revclaw/projects/:id/marketer/metrics
 *
 * Marketer-bot metrics endpoint (bot-safe):
 * - Attribution clicks / installs for this marketer
 * - Purchases + revenue + commission sums attributed to this marketer
 *
 * Scope: projects:read
 * Requires an APPROVED contract for the marketer+project.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "projects:read");

    const { id: projectId } = await params;

    const [marketer, contract] = await Promise.all([
      prisma.user.findUnique({ where: { id: agent.userId }, select: { role: true } }),
      prisma.contract.findUnique({
        where: { projectId_userId: { projectId, userId: agent.userId } },
        select: { status: true },
      }),
    ]);

    if (!marketer || marketer.role !== "marketer") {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    if (contract?.status !== "APPROVED") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const since7 = daysAgoUTC(7);
    const since30 = daysAgoUTC(30);

    const clickWhereBase = {
      projectId,
      marketerId: agent.userId,
    };

    const clickFilter = {
      OR: [
        { deviceId: { startsWith: "click:" } },
        { NOT: { deviceId: { startsWith: "install:" } } },
      ],
    };
    const [
      clicksTotal,
      clicks7d,
      clicks30d,
      installsTotal,
      installs7d,
      installs30d,
    ] = await Promise.all([
      prisma.attributionClick.count({ where: { ...clickWhereBase, ...clickFilter } }),
      prisma.attributionClick.count({ where: { ...clickWhereBase, ...clickFilter, createdAt: { gte: since7 } } }),
      prisma.attributionClick.count({ where: { ...clickWhereBase, ...clickFilter, createdAt: { gte: since30 } } }),
      prisma.attributionClick.count({ where: { ...clickWhereBase, deviceId: { startsWith: "install:" } } }),
      prisma.attributionClick.count({ where: { ...clickWhereBase, deviceId: { startsWith: "install:" }, createdAt: { gte: since7 } } }),
      prisma.attributionClick.count({ where: { ...clickWhereBase, deviceId: { startsWith: "install:" }, createdAt: { gte: since30 } } }),
    ]);

    // Purchases attributed to marketer.
    // We treat purchases as attributed if:
    // - purchase.coupon.marketerId == agent.userId OR purchase.marketerId == agent.userId
    const purchaseWhere = {
      projectId,
      OR: [{ coupon: { marketerId: agent.userId } }, { marketerId: agent.userId }],
    };
    const [purchasesTotal, purchases7d, purchases30d] = await Promise.all([
      prisma.purchase.findMany({
        where: purchaseWhere,
        select: { amount: true, commissionAmount: true, createdAt: true },
      }),
      prisma.purchase.findMany({
        where: { ...purchaseWhere, createdAt: { gte: since7 } },
        select: { amount: true, commissionAmount: true },
      }),
      prisma.purchase.findMany({
        where: { ...purchaseWhere, createdAt: { gte: since30 } },
        select: { amount: true, commissionAmount: true },
      }),
    ]);

    const sum = (rows: Array<{ amount: number; commissionAmount: number }>) => {
      return rows.reduce(
        (acc, row) => {
          acc.revenue += row.amount;
          acc.commission += row.commissionAmount;
          return acc;
        },
        { revenue: 0, commission: 0 },
      );
    };

    const totalsAll = sum(purchasesTotal);
    const totals7 = sum(purchases7d);
    const totals30 = sum(purchases30d);

    return NextResponse.json(
      {
        data: {
          project_id: projectId,
          marketer_id: agent.userId,
          attribution: {
            clicks: { total: clicksTotal, last7d: clicks7d, last30d: clicks30d },
            installs: { total: installsTotal, last7d: installs7d, last30d: installs30d },
          },
          purchases: {
            count: {
              total: purchasesTotal.length,
              last7d: purchases7d.length,
              last30d: purchases30d.length,
            },
            revenue: {
              total: totalsAll.revenue,
              last7d: totals7.revenue,
              last30d: totals30.revenue,
            },
            commission: {
              total: totalsAll.commission,
              last7d: totals7.commission,
              last30d: totals30.commission,
            },
          },
          windows: {
            since_7d: since7.toISOString(),
            since_30d: since30.toISOString(),
          },
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
