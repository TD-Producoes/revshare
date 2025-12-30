import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const templateInput = z.object({
  creatorId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  percentOff: z.number().int().min(1).max(100),
  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  productIds: z.array(z.string().min(1)).optional(),
  allowedMarketerIds: z.array(z.string().min(1)).optional(),
});

const templateUpdateInput = z.object({
  creatorId: z.string().min(1),
  templateId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  percentOff: z.number().int().min(1).max(100),
  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  productIds: z.array(z.string().min(1)).optional(),
  allowedMarketerIds: z.array(z.string().min(1)).optional(),
});

const normalizeIds = (ids: string[] | null | undefined) =>
  (ids ?? []).filter(Boolean).sort();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("includeAll") === "true";
  const marketerId = searchParams.get("marketerId");
  const now = new Date();
  const isMarketerView = Boolean(marketerId);

  const templates = await prisma.couponTemplate.findMany({
    where: {
      projectId,
      ...(includeAll && !isMarketerView
        ? {}
        : {
            status: "ACTIVE",
            AND: [
              { OR: [{ startAt: null }, { startAt: { lte: now } }] },
              { OR: [{ endAt: null }, { endAt: { gte: now } }] },
            ],
          }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      percentOff: true,
      startAt: true,
      endAt: true,
      maxRedemptions: true,
      productIds: true,
      allowedMarketerIds: true,
      status: true,
      createdAt: true,
    },
  });

  const filteredTemplates = isMarketerView
    ? templates.filter((template) => {
        const allowed = Array.isArray(template.allowedMarketerIds)
          ? template.allowedMarketerIds
          : [];
        return allowed.length === 0 || allowed.includes(marketerId);
      })
    : templates;

  return NextResponse.json({ data: filteredTemplates });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const parsed = templateInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, creatorStripeAccountId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== payload.creatorId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Creator Stripe account not set" },
      { status: 400 },
    );
  }

  const startAt = payload.startAt ? new Date(payload.startAt) : null;
  const endAt = payload.endAt ? new Date(payload.endAt) : null;
  if (startAt && Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid startAt date" }, { status: 400 });
  }
  if (endAt && Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Invalid endAt date" }, { status: 400 });
  }
  if (startAt && endAt && startAt > endAt) {
    return NextResponse.json(
      { error: "startAt must be before endAt" },
      { status: 400 },
    );
  }

  const stripe = platformStripe();
  const stripeAccount = project.creatorStripeAccountId;
  const stripeCoupon = await stripe.coupons.create(
    {
      percent_off: payload.percentOff,
      duration: "once",
      ...(payload.maxRedemptions ? { max_redemptions: payload.maxRedemptions } : {}),
      ...(endAt ? { redeem_by: Math.floor(endAt.getTime() / 1000) } : {}),
      ...(payload.productIds?.length
        ? { applies_to: { products: payload.productIds } }
        : {}),
      metadata: {
        projectId: project.id,
      },
    },
    { stripeAccount },
  );

  const template = await prisma.couponTemplate.create({
    data: {
      projectId: project.id,
      name: payload.name,
      description: payload.description,
      percentOff: payload.percentOff,
      startAt,
      endAt,
      maxRedemptions: payload.maxRedemptions,
      productIds: payload.productIds ?? [],
      allowedMarketerIds: payload.allowedMarketerIds ?? [],
      stripeCouponId: stripeCoupon.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      description: true,
      percentOff: true,
      startAt: true,
      endAt: true,
      maxRedemptions: true,
      productIds: true,
      allowedMarketerIds: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: template }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const parsed = templateUpdateInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, creatorStripeAccountId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== payload.creatorId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Creator Stripe account not set" },
      { status: 400 },
    );
  }

  const template = await prisma.couponTemplate.findFirst({
    where: { id: payload.templateId, projectId },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const startAt = payload.startAt ? new Date(payload.startAt) : null;
  const endAt = payload.endAt ? new Date(payload.endAt) : null;
  if (startAt && Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid startAt date" }, { status: 400 });
  }
  if (endAt && Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Invalid endAt date" }, { status: 400 });
  }
  if (startAt && endAt && startAt > endAt) {
    return NextResponse.json(
      { error: "startAt must be before endAt" },
      { status: 400 },
    );
  }

  const nextProductIds = payload.productIds ?? [];
  const nextMaxRedemptions = payload.maxRedemptions ?? null;
  const nextPercentOff = payload.percentOff;
  const nextEndAt = endAt;

  const productIdsChanged =
    normalizeIds(nextProductIds).join("|") !==
    normalizeIds(template.productIds as string[] | null).join("|");
  const maxRedemptionsChanged =
    (template.maxRedemptions ?? null) !== nextMaxRedemptions;
  const percentOffChanged = template.percentOff !== nextPercentOff;
  const endAtChanged =
    (template.endAt ? template.endAt.toISOString() : null) !==
    (nextEndAt ? nextEndAt.toISOString() : null);

  const shouldReplaceCoupon =
    productIdsChanged || maxRedemptionsChanged || percentOffChanged || endAtChanged;

  let stripeCouponId = template.stripeCouponId;
  if (shouldReplaceCoupon) {
    const stripe = platformStripe();
    const stripeCoupon = await stripe.coupons.create(
      {
        percent_off: nextPercentOff,
        duration: "once",
        ...(nextMaxRedemptions ? { max_redemptions: nextMaxRedemptions } : {}),
        ...(nextEndAt ? { redeem_by: Math.floor(nextEndAt.getTime() / 1000) } : {}),
        ...(nextProductIds.length
          ? { applies_to: { products: nextProductIds } }
          : {}),
        metadata: {
          projectId: project.id,
        },
      },
      { stripeAccount: project.creatorStripeAccountId },
    );
    stripeCouponId = stripeCoupon.id;
  }

  const updatedTemplate = await prisma.couponTemplate.update({
    where: { id: template.id },
    data: {
      name: payload.name,
      description: payload.description,
      percentOff: nextPercentOff,
      startAt,
      endAt: nextEndAt,
      maxRedemptions: nextMaxRedemptions,
      productIds: nextProductIds,
      allowedMarketerIds: payload.allowedMarketerIds ?? [],
      stripeCouponId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      percentOff: true,
      startAt: true,
      endAt: true,
      maxRedemptions: true,
      productIds: true,
      allowedMarketerIds: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: updatedTemplate });
}
