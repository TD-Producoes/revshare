import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const contracts = await prisma.contract.findMany({
    where: { projectId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const data = contracts.map((contract) => ({
    id: contract.user.id,
    name: contract.user.name,
    email: contract.user.email,
  }));

  return NextResponse.json({ data });
}
