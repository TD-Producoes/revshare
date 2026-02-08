import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";
import {
  authErrorResponse,
  getAuthUserOptional,
  requireAuthUser,
  requireOwner,
} from "@/lib/auth";
import { redactProjectData } from "@/lib/services/visibility";
import { getDefaultPlatformCommissionPercent } from "@/lib/config/platform-commission";

const projectInput = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  creatorStripeAccountId: z.string().min(1).optional(),
  marketerCommissionPercent: z.number().min(0).max(100).optional(),
  country: z.string().length(2).optional(),
  website: z.string().url().optional().or(z.literal("")),
  appStoreUrl: z.string().url().optional().or(z.literal("")),
  playStoreUrl: z.string().url().optional().or(z.literal("")),
  foundationDate: z.string().datetime().optional().or(z.literal("")),
  about: z.string().max(5000).optional(),
  features: z.array(z.string().max(100)).max(10).optional(),
  logoUrl: z.string().url().optional(),
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
});

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

export async function GET() {
  const authUser = await getAuthUserOptional();

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { visibility: { in: ["PUBLIC", "GHOST"] } },
        ...(authUser ? [{ userId: authUser.id }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      refundWindowDays: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      // Lightweight aggregates for directory cards
      _count: {
        select: {
          contracts: true,
        },
      },
      metricsSnapshots: {
        take: 1,
        orderBy: { date: "desc" },
        select: {
          totalRevenue: true,
          mrr: true,
          purchasesCount: true,
          affiliateRevenue: true,
        },
      },
      creatorStripeAccountId: true,
      currency: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
      country: true,
      website: true,
      appStoreUrl: true,
      playStoreUrl: true,
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
      autoApproveApplications: true,
      autoApproveMatchTerms: true,
      autoApproveVerifiedOnly: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const redactedProjects = projects
    .map((project) =>
      redactProjectData(project, authUser?.id === project.userId)
    )
    .filter(Boolean);

  return NextResponse.json({ data: redactedProjects });
}

export async function POST(request: Request) {
  const parsed = projectInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, payload.userId);
  } catch (error) {
    return authErrorResponse(error);
  }
  const creator = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  let creatorStripeAccountId: string | null = null;
  if (payload.creatorStripeAccountId) {
    const stripe = platformStripe();
    try {
      const account = await stripe.accounts.retrieve(
        payload.creatorStripeAccountId
      );
      creatorStripeAccountId = account.id;
    } catch {
      return NextResponse.json(
        { error: "Connected account not found" },
        { status: 404 }
      );
    }

    // Check if this Stripe account is already connected to another project
    const existingProject = await prisma.project.findFirst({
      where: { creatorStripeAccountId },
      select: { id: true },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          error:
            "This Stripe account is already connected to another project",
        },
        { status: 400 }
      );
    }
  }
  const platformCommissionRaw = getDefaultPlatformCommissionPercent();
  const marketerCommissionRaw = payload.marketerCommissionPercent ?? 20;
  const platformCommissionPercent = normalizePercent(platformCommissionRaw);
  const marketerCommissionPercent = normalizePercent(marketerCommissionRaw);

  if (platformCommissionPercent + marketerCommissionPercent > 1) {
    return NextResponse.json(
      { error: "Combined commission percent cannot exceed 100%" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      user: { connect: { id: payload.userId } },
      name: payload.name,
      description: payload.description,
      ...(payload.category ? { category: payload.category } : {}),
      ...(payload.refundWindowDays !== undefined
        ? { refundWindowDays: payload.refundWindowDays }
        : {}),
      ...(creatorStripeAccountId ? { creatorStripeAccountId } : {}),
      platformCommissionPercent: platformCommissionPercent.toString(),
      marketerCommissionPercent: marketerCommissionPercent.toString(),
      ...(payload.country ? { country: payload.country } : {}),
      ...(payload.website ? { website: payload.website } : {}),
      ...(payload.appStoreUrl ? { appStoreUrl: payload.appStoreUrl } : {}),
      ...(payload.playStoreUrl ? { playStoreUrl: payload.playStoreUrl } : {}),
      ...(payload.foundationDate
        ? { foundationDate: new Date(payload.foundationDate) }
        : {}),
      ...(payload.about ? { about: payload.about } : {}),
      ...(payload.features ? { features: payload.features } : {}),
      ...(payload.logoUrl ? { logoUrl: payload.logoUrl } : {}),
      ...(payload.imageUrls ? { imageUrls: payload.imageUrls } : {}),
      ...(payload.visibility ? { visibility: payload.visibility } : {}),
      ...(payload.showMrr !== undefined ? { showMrr: payload.showMrr } : {}),
      ...(payload.showRevenue !== undefined
        ? { showRevenue: payload.showRevenue }
        : {}),
      ...(payload.showStats !== undefined ? { showStats: payload.showStats } : {}),
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
      refundWindowDays: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      creatorStripeAccountId: true,
      currency: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
      country: true,
      website: true,
      appStoreUrl: true,
      playStoreUrl: true,
      foundationDate: true,
      about: true,
      features: true,
      logoUrl: true,
      imageUrls: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
