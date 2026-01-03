import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const rewardInput = z.object({
  creatorId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  milestoneType: z.enum(["NET_REVENUE", "COMPLETED_SALES", "ACTIVE_CUSTOMERS"]),
  milestoneValue: z.number().int().min(1),
  startsAt: z.string().optional().nullable(),
  rewardType: z.enum([
    "DISCOUNT_COUPON",
    "FREE_SUBSCRIPTION",
    "PLAN_UPGRADE",
    "ACCESS_PERK",
  ]),
  rewardPercentOff: z.number().int().min(1).max(100).optional(),
  rewardDurationMonths: z.number().int().min(1).max(12).optional(),
  fulfillmentType: z.enum(["AUTO_COUPON", "MANUAL"]),
  earnLimit: z.enum(["ONCE_PER_MARKETER", "MULTIPLE"]),
  availabilityType: z.enum(["UNLIMITED", "FIRST_N"]),
  availabilityLimit: z.number().int().min(1).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

const rewardUpdateInput = rewardInput.extend({
  rewardId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

const rewardStatusInput = z.object({
  creatorId: z.string().min(1),
  rewardId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
});

const buildRewardLabel = (payload: z.infer<typeof rewardInput>) => {
  if (payload.rewardType === "DISCOUNT_COUPON") {
    return `${payload.rewardPercentOff ?? 0}% discount`;
  }
  if (payload.rewardType === "FREE_SUBSCRIPTION") {
    const months = payload.rewardDurationMonths ?? 1;
    return `Free ${months} month${months === 1 ? "" : "s"}`;
  }
  if (payload.rewardType === "PLAN_UPGRADE") {
    return "Plan upgrade";
  }
  return "Access / perk";
};

const parseOptionalDate = (value?: string | null) => {
  if (!value) {
    return { date: null, valid: true };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: null, valid: false };
  }
  return { date, valid: true };
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const parsed = rewardInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== payload.creatorId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (
    payload.availabilityType === "FIRST_N" &&
    (!payload.availabilityLimit || payload.availabilityLimit < 1)
  ) {
    return NextResponse.json(
      { error: "availabilityLimit is required when availability is capped" },
      { status: 400 },
    );
  }

  if (
    payload.rewardType === "DISCOUNT_COUPON" &&
    (payload.rewardPercentOff ?? 0) < 1
  ) {
    return NextResponse.json(
      { error: "rewardPercentOff is required for discount rewards" },
      { status: 400 },
    );
  }

  if (
    payload.rewardType === "FREE_SUBSCRIPTION" &&
    (!payload.rewardDurationMonths || payload.rewardDurationMonths < 1)
  ) {
    return NextResponse.json(
      { error: "rewardDurationMonths is required for free subscription rewards" },
      { status: 400 },
    );
  }

  const { date: startsAtInput, valid: startsAtValid } = parseOptionalDate(
    payload.startsAt,
  );
  if (!startsAtValid) {
    return NextResponse.json({ error: "Invalid startsAt date" }, { status: 400 });
  }
  const startsAt = startsAtInput ?? new Date();

  const reward = await prisma.reward.create({
    data: {
      projectId: project.id,
      name: payload.name,
      description: payload.description,
      milestoneType: payload.milestoneType,
      milestoneValue: payload.milestoneValue,
      startsAt,
      rewardType: payload.rewardType,
      rewardLabel: buildRewardLabel(payload),
      rewardPercentOff:
        payload.rewardType === "DISCOUNT_COUPON" ? payload.rewardPercentOff : null,
      rewardDurationMonths:
        payload.rewardType === "FREE_SUBSCRIPTION"
          ? payload.rewardDurationMonths
          : null,
      fulfillmentType: payload.fulfillmentType,
      earnLimit: payload.earnLimit,
      availabilityType: payload.availabilityType,
      availabilityLimit:
        payload.availabilityType === "FIRST_N" ? payload.availabilityLimit : null,
      visibility: payload.visibility,
      status: "DRAFT",
    },
  });

  await prisma.event.create({
    data: {
      type: "REWARD_CREATED",
      actorId: payload.creatorId,
      projectId: project.id,
      subjectType: "Reward",
      subjectId: reward.id,
      data: {
        rewardId: reward.id,
        rewardName: reward.name,
        status: reward.status,
      },
    },
  });

  return NextResponse.json({ data: reward }, { status: 201 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId");

  if (!creatorId) {
    return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== creatorId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const rewards = await prisma.reward.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: rewards });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = rewardUpdateInput.safeParse(body);
  const statusParsed = rewardStatusInput.safeParse(body);

  if (!parsed.success && !statusParsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error?.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.success ? parsed.data : statusParsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== payload.creatorId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const existing = await prisma.reward.findUnique({
    where: { id: payload.rewardId },
  });
  if (!existing || existing.projectId !== projectId) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }

  if ("status" in payload && !("name" in payload)) {
    const updated = await prisma.reward.update({
      where: { id: existing.id },
      data: { status: payload.status },
    });

    await prisma.event.create({
      data: {
        type: "REWARD_STATUS_CHANGED",
        actorId: payload.creatorId,
        projectId: project.id,
        subjectType: "Reward",
        subjectId: updated.id,
        data: {
          rewardId: updated.id,
          rewardName: updated.name,
          status: updated.status,
        },
      },
    });

    return NextResponse.json({ data: updated });
  }

  const fullPayload = parsed.success ? parsed.data : null;
  if (!fullPayload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (
    fullPayload.availabilityType === "FIRST_N" &&
    (!fullPayload.availabilityLimit || fullPayload.availabilityLimit < 1)
  ) {
    return NextResponse.json(
      { error: "availabilityLimit is required when availability is capped" },
      { status: 400 },
    );
  }

  if (
    fullPayload.rewardType === "DISCOUNT_COUPON" &&
    (fullPayload.rewardPercentOff ?? 0) < 1
  ) {
    return NextResponse.json(
      { error: "rewardPercentOff is required for discount rewards" },
      { status: 400 },
    );
  }

  if (
    fullPayload.rewardType === "FREE_SUBSCRIPTION" &&
    (!fullPayload.rewardDurationMonths || fullPayload.rewardDurationMonths < 1)
  ) {
    return NextResponse.json(
      { error: "rewardDurationMonths is required for free subscription rewards" },
      { status: 400 },
    );
  }

  const { date: updateStartsAt, valid: updateStartsAtValid } = parseOptionalDate(
    fullPayload.startsAt,
  );
  if (!updateStartsAtValid) {
    return NextResponse.json({ error: "Invalid startsAt date" }, { status: 400 });
  }

  const updated = await prisma.reward.update({
    where: { id: existing.id },
    data: {
      name: fullPayload.name,
      description: fullPayload.description,
      milestoneType: fullPayload.milestoneType,
      milestoneValue: fullPayload.milestoneValue,
      ...(updateStartsAt ? { startsAt: updateStartsAt } : {}),
      rewardType: fullPayload.rewardType,
      rewardLabel: buildRewardLabel(fullPayload),
      rewardPercentOff:
        fullPayload.rewardType === "DISCOUNT_COUPON"
          ? fullPayload.rewardPercentOff
          : null,
      rewardDurationMonths:
        fullPayload.rewardType === "FREE_SUBSCRIPTION"
          ? fullPayload.rewardDurationMonths
          : null,
      fulfillmentType: fullPayload.fulfillmentType,
      earnLimit: fullPayload.earnLimit,
      availabilityType: fullPayload.availabilityType,
      availabilityLimit:
        fullPayload.availabilityType === "FIRST_N"
          ? fullPayload.availabilityLimit
          : null,
      visibility: fullPayload.visibility,
      status: fullPayload.status ?? existing.status,
    },
  });

  await prisma.event.create({
    data: {
      type: "REWARD_UPDATED",
      actorId: fullPayload.creatorId,
      projectId: project.id,
      subjectType: "Reward",
      subjectId: updated.id,
      data: {
        rewardId: updated.id,
        rewardName: updated.name,
        status: updated.status,
      },
    },
  });

  return NextResponse.json({ data: updated });
}
