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
    country: z.string().length(2).optional().nullable(),
    website: z.string().url().optional().nullable().or(z.literal("")),
    foundationDate: z
      .string()
      .datetime()
      .optional()
      .nullable()
      .or(z.literal("")),
    about: z.string().max(5000).optional().nullable(),
    features: z.array(z.string().max(100)).max(10).optional(),
    logoUrl: z.string().url().optional().nullable(),
    imageUrls: z.array(z.string().url()).max(6).optional(),
    refundWindowDays: z.number().int().min(0).max(3650).optional(),
  })
  .refine(
    (data) =>
      data.name ||
      data.description !== undefined ||
      data.currency ||
      data.category ||
      data.marketerCommissionPercent !== undefined ||
      data.country !== undefined ||
      data.website !== undefined ||
      data.foundationDate !== undefined ||
      data.about !== undefined ||
      data.features !== undefined ||
      data.logoUrl !== undefined ||
      data.imageUrls !== undefined ||
      data.refundWindowDays !== undefined,
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
      category: true,
      userId: true,
      creatorStripeAccountId: true,
      currency: true,
      refundWindowDays: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
      country: true,
      website: true,
      foundationDate: true,
      about: true,
      features: true,
      logoUrl: true,
      imageUrls: true,
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
      ...(payload.refundWindowDays !== undefined
        ? { refundWindowDays: payload.refundWindowDays }
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
      ...(payload.country !== undefined ? { country: payload.country } : {}),
      ...(payload.website !== undefined
        ? { website: payload.website || null }
        : {}),
      ...(payload.foundationDate !== undefined
        ? {
            foundationDate: payload.foundationDate
              ? new Date(payload.foundationDate)
              : null,
          }
        : {}),
      ...(payload.about !== undefined ? { about: payload.about } : {}),
      ...(payload.features !== undefined ? { features: payload.features } : {}),
      ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl } : {}),
      ...(payload.imageUrls !== undefined
        ? { imageUrls: payload.imageUrls }
        : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      currency: true,
      refundWindowDays: true,
      marketerCommissionPercent: true,
      country: true,
      website: true,
      foundationDate: true,
      about: true,
      features: true,
      logoUrl: true,
      imageUrls: true,
    },
  });

  return NextResponse.json({ data: updated });
}
