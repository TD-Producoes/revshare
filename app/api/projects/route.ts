import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const projectInput = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  creatorStripeAccountId: z.string().min(1).optional(),
  platformCommissionPercent: z.number().min(0).max(100).optional(),
  marketerCommissionPercent: z.number().min(0).max(100).optional(),
  country: z.string().length(2).optional(),
  website: z.string().url().optional().or(z.literal("")),
  foundationDate: z.string().datetime().optional().or(z.literal("")),
  about: z.string().max(5000).optional(),
  features: z.array(z.string().max(100)).max(10).optional(),
  logoUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(6).optional(),
  refundWindowDays: z.number().int().min(0).max(3650).optional(),
});

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

export async function GET() {
  const projects = await prisma.project.findMany({
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
      foundationDate: true,
      about: true,
      features: true,
      logoUrl: true,
      imageUrls: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: projects });
}

export async function POST(request: Request) {
  const parsed = projectInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const creator = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  let creatorStripeAccountId: string | null = null;
  if (payload.creatorStripeAccountId) {
    const stripe = platformStripe();
    try {
      const account = await stripe.accounts.retrieve(
        payload.creatorStripeAccountId,
      );
      creatorStripeAccountId = account.id;
    } catch {
      return NextResponse.json(
        { error: "Connected account not found" },
        { status: 404 },
      );
    }
  }
  const platformCommissionRaw = payload.platformCommissionPercent ?? 20;
  const marketerCommissionRaw = payload.marketerCommissionPercent ?? 20;
  const platformCommissionPercent = normalizePercent(platformCommissionRaw);
  const marketerCommissionPercent = normalizePercent(marketerCommissionRaw);

  if (platformCommissionPercent + marketerCommissionPercent > 1) {
    return NextResponse.json(
      { error: "Combined commission percent cannot exceed 100%" },
      { status: 400 },
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
      ...(creatorStripeAccountId
        ? { creatorStripeAccountId }
        : {}),
      platformCommissionPercent: platformCommissionPercent.toString(),
      marketerCommissionPercent: marketerCommissionPercent.toString(),
      ...(payload.country ? { country: payload.country } : {}),
      ...(payload.website ? { website: payload.website } : {}),
      ...(payload.foundationDate
        ? { foundationDate: new Date(payload.foundationDate) }
        : {}),
      ...(payload.about ? { about: payload.about } : {}),
      ...(payload.features ? { features: payload.features } : {}),
      ...(payload.logoUrl ? { logoUrl: payload.logoUrl } : {}),
      ...(payload.imageUrls ? { imageUrls: payload.imageUrls } : {}),
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
