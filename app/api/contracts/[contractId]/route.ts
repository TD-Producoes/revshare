import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const statusInput = z.object({
  creatorId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const parsed = statusInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { contractId } = await params;
  const { creatorId, status } = parsed.data;

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { project: { select: { userId: true } } },
  });

  if (!contract || contract.project.userId !== creatorId) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: status.toUpperCase() },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      status: updated.status.toLowerCase(),
      updatedAt: updated.updatedAt,
    },
  });
}
