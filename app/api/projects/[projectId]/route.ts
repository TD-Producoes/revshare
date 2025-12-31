import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    userId: z.string().min(1),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().min(1).optional(),
    currency: z.string().min(3).max(3).optional(),
    marketerCommissionPercent: z.number().min(0).max(100).optional(),
  })
  .refine(
    (data) =>
      data.name ||
      data.description !== undefined ||
      data.currency ||
      data.category ||
      data.marketerCommissionPercent !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      userId: true,
      creatorStripeAccountId: true,
      currency: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
      createdAt: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ data: project });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId } = await params;
  const payload = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
    },
  });

  if (!project || project.userId !== payload.userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const nextMarketerPercent =
    payload.marketerCommissionPercent !== undefined
      ? payload.marketerCommissionPercent
      : Number(project.marketerCommissionPercent) * 100;
  const platformPercent = Number(project.platformCommissionPercent) * 100;

  if (nextMarketerPercent + platformPercent > 100) {
    return NextResponse.json(
      { error: "Combined commission percent cannot exceed 100%" },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.description !== undefined
        ? { description: payload.description }
        : {}),
      ...(payload.category ? { category: payload.category } : {}),
      ...(payload.currency
        ? { currency: payload.currency.toUpperCase() }
        : {}),
      ...(payload.marketerCommissionPercent !== undefined
        ? {
            marketerCommissionPercent: (
              payload.marketerCommissionPercent > 1
                ? payload.marketerCommissionPercent / 100
                : payload.marketerCommissionPercent
            ).toString(),
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      currency: true,
      marketerCommissionPercent: true,
    },
  });

  return NextResponse.json({ data: updated });
}
