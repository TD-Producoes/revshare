import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const purchases = await prisma.purchase.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      coupon: {
        select: {
          id: true,
          code: true,
          percentOff: true,
          marketer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ data: purchases });
}
