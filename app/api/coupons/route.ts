import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketerId = searchParams.get("marketerId");

  if (!marketerId) {
    return NextResponse.json(
      { error: "marketerId is required" },
      { status: 400 },
    );
  }

  const marketer = await prisma.user.findUnique({
    where: { id: marketerId },
    select: { id: true, role: true },
  });
  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const coupons = await prisma.coupon.findMany({
    where: { marketerId },
    select: {
      id: true,
      projectId: true,
      code: true,
      percentOff: true,
      commissionPercent: true,
      status: true,
      claimedAt: true,
    },
    orderBy: { claimedAt: "desc" },
  });

  return NextResponse.json({ data: coupons });
}
