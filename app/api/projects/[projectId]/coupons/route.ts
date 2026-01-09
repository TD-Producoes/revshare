import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

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

  const contracts = await prisma.contract.findMany({
    where: { projectId },
    select: { userId: true, refundWindowDays: true },
  });
  const refundWindowByMarketer = new Map(
    contracts.map((contract) => [contract.userId, contract.refundWindowDays]),
  );

  const coupons = await prisma.coupon.findMany({
    where: { projectId },
    select: {
      id: true,
      templateId: true,
      code: true,
      percentOff: true,
      commissionPercent: true,
      status: true,
      claimedAt: true,
      template: {
        select: {
          name: true,
          startAt: true,
          endAt: true,
          status: true,
        },
      },
      marketer: {
        select: {
          id: true,
          name: true,
          email: true,
          stripeConnectedAccountId: true,
        },
      },
    },
    orderBy: { claimedAt: "desc" },
  });

  const enriched = coupons.map((coupon) => ({
    ...coupon,
    refundWindowDays: refundWindowByMarketer.get(coupon.marketer.id) ?? null,
  }));

  return NextResponse.json({ data: enriched });
}
