import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);

  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify project ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== authUser.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const parsed = querySchema.safeParse({
    days: searchParams.get("days") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const lookbackDays = parsed.data.days ?? 30;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);

  const snapshots = await prisma.metricsSnapshot.findMany({
    where: {
      projectId,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      totalRevenue: true,
      affiliateRevenue: true,
      affiliateShareOwed: true,
      platformFee: true,
      mrr: true,
      purchasesCount: true,
      uniqueCustomers: true,
      affiliatePurchasesCount: true,
      directPurchasesCount: true,
      affiliateCustomers: true,
      totalRevenueDay: true,
      affiliateRevenueDay: true,
      affiliateShareOwedDay: true,
      platformFeeDay: true,
      purchasesCountDay: true,
      affiliatePurchasesCountDay: true,
      directPurchasesCountDay: true,
      uniqueCustomersDay: true,
      affiliateCustomersDay: true,
    },
  });

  if (snapshots.length === 0) {
    return NextResponse.json({
      data: {
        summary: {
          totalRevenue: 0,
          affiliateRevenue: 0,
          mrr: 0,
          activeSubscribers: 0,
        },
        timeline: [],
      },
    });
  }

  const latest = snapshots[snapshots.length - 1];
  const summary = {
    totalRevenue: latest?.totalRevenue ?? 0,
    affiliateRevenue: latest?.affiliateRevenue ?? 0,
    affiliateShareOwed: latest?.affiliateShareOwed ?? 0,
    platformFee: latest?.platformFee ?? 0,
    mrr: latest?.mrr ?? 0,
    activeSubscribers: latest?.uniqueCustomers ?? 0,
    affiliatePurchases: latest?.affiliatePurchasesCount ?? 0,
    directPurchases: latest?.directPurchasesCount ?? 0,
    affiliateMrr: 0,
    affiliateSubscribers: 0,
    customers: latest?.uniqueCustomers ?? 0,
    affiliateCustomers: latest?.affiliateCustomers ?? 0,
  };

  summary.affiliateMrr = summary.totalRevenue
    ? Math.round((summary.affiliateRevenue / summary.totalRevenue) * summary.mrr)
    : 0;
  summary.affiliateSubscribers =
    summary.mrr > 0
      ? Math.round((summary.affiliateMrr / summary.mrr) * summary.activeSubscribers)
      : 0;

  const timeline = snapshots.map((snapshot) => ({
    date: snapshot.date.toISOString(),
    totalRevenue: snapshot.totalRevenueDay,
    affiliateRevenue: snapshot.affiliateRevenueDay,
    affiliateShareOwed: snapshot.affiliateShareOwedDay,
    platformFee: snapshot.platformFeeDay,
    purchasesCount: snapshot.purchasesCountDay,
    affiliatePurchasesCount: snapshot.affiliatePurchasesCountDay,
    directPurchasesCount: snapshot.directPurchasesCountDay,
    uniqueCustomers: snapshot.uniqueCustomersDay,
    affiliateCustomers: snapshot.affiliateCustomersDay,
  }));

  return NextResponse.json({ data: { summary, timeline } });
}
