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
      userId: true,
      creatorStripeAccountId: true,
      currency: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
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
      ...(creatorStripeAccountId
        ? { creatorStripeAccountId }
        : {}),
      platformCommissionPercent: platformCommissionPercent.toString(),
      marketerCommissionPercent: marketerCommissionPercent.toString(),
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      userId: true,
      creatorStripeAccountId: true,
      currency: true,
      platformCommissionPercent: true,
      marketerCommissionPercent: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
