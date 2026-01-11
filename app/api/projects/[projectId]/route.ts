import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  authErrorResponse,
  getAuthUserOptional,
  requireAuthUser,
} from "@/lib/auth";
import { redactProjectData } from "@/lib/services/visibility";

const updateSchema = z
  .object({
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
    visibility: z.enum(["PUBLIC", "GHOST", "PRIVATE"]).optional(),
    showMrr: z.boolean().optional(),
    showRevenue: z.boolean().optional(),
    showStats: z.boolean().optional(),
    showAvgCommission: z.boolean().optional(),
    autoApproveApplications: z.boolean().optional(),
    autoApproveMatchTerms: z.boolean().optional(),
    autoApproveVerifiedOnly: z.boolean().optional(),
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
      data.refundWindowDays !== undefined ||
      data.visibility !== undefined ||
      data.showMrr !== undefined ||
      data.showRevenue !== undefined ||
      data.showStats !== undefined ||
      data.showAvgCommission !== undefined ||
      data.autoApproveApplications !== undefined ||
      data.autoApproveMatchTerms !== undefined ||
      data.autoApproveVerifiedOnly !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const authUser = await getAuthUserOptional();

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
      visibility: true,
      showMrr: true,
      showRevenue: true,
      showStats: true,
      showAvgCommission: true,
      autoApproveApplications: true,
      autoApproveMatchTerms: true,
      autoApproveVerifiedOnly: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = authUser?.id === project.userId;

  // Check if user is a marketer with an approved contract for this project
  let hasContract = false;
  if (authUser?.id && !isOwner) {
    const contract = await prisma.contract.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: authUser.id,
        },
      },
      select: { status: true },
    });
    hasContract = contract?.status === "APPROVED";
  }

  // Allow access if user is owner OR has an approved contract
  const hasAccess = isOwner || hasContract;
  if (project.visibility === "PRIVATE" && !hasAccess) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Marketers with contracts should see full project details (like owners)
  const redacted = redactProjectData(project, hasAccess);

  return NextResponse.json({ data: redacted });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
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

  if (!project || project.userId !== authUser.id) {
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
      { status: 400 }
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
      ...(payload.currency ? { currency: payload.currency.toUpperCase() } : {}),
      ...(payload.refundWindowDays !== undefined
        ? { refundWindowDays: payload.refundWindowDays }
        : {}),
      ...(payload.marketerCommissionPercent !== undefined
        ? {
            marketerCommissionPercent: (payload.marketerCommissionPercent > 1
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
      ...(payload.visibility !== undefined
        ? { visibility: payload.visibility }
        : {}),
      ...(payload.showMrr !== undefined ? { showMrr: payload.showMrr } : {}),
      ...(payload.showRevenue !== undefined
        ? { showRevenue: payload.showRevenue }
        : {}),
      ...(payload.showStats !== undefined
        ? { showStats: payload.showStats }
        : {}),
      ...(payload.showAvgCommission !== undefined
        ? { showAvgCommission: payload.showAvgCommission }
        : {}),
      ...(payload.autoApproveApplications !== undefined
        ? { autoApproveApplications: payload.autoApproveApplications }
        : {}),
      ...(payload.autoApproveMatchTerms !== undefined
        ? { autoApproveMatchTerms: payload.autoApproveMatchTerms }
        : {}),
      ...(payload.autoApproveVerifiedOnly !== undefined
        ? { autoApproveVerifiedOnly: payload.autoApproveVerifiedOnly }
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
      visibility: true,
      showMrr: true,
      showRevenue: true,
      showStats: true,
      showAvgCommission: true,
      autoApproveApplications: true,
      autoApproveMatchTerms: true,
      autoApproveVerifiedOnly: true,
    },
  });

  return NextResponse.json({ data: updated });
}
