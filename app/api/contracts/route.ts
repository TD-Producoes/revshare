import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createContractInput = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  commissionPercent: z.number().min(0).max(100),
});

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId");
  const userId = searchParams.get("userId");

  if (!creatorId && !userId) {
    return NextResponse.json(
      { error: "creatorId or userId is required" },
      { status: 400 },
    );
  }

  if (userId) {
    const marketer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!marketer || marketer.role !== "marketer") {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    const contracts = await prisma.contract.findMany({
      where: { userId, user: { role: "marketer" } },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const data = contracts.map((contract) => ({
      id: contract.id,
      projectId: contract.projectId,
      projectName: contract.project.name,
      userId: contract.userId,
      userName: contract.user.name,
      userEmail: contract.user.email,
      userRole: contract.user.role,
      commissionPercent: Number(contract.commissionPercent),
      status: contract.status.toLowerCase(),
      createdAt: contract.createdAt,
    }));

    return NextResponse.json({ data });
  }

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const creatorProjects = await prisma.project.findMany({
    where: { userId: creatorId },
    select: { id: true },
  });

  const projectIds = creatorProjects.map((project) => project.id);
  if (projectIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const contracts = await prisma.contract.findMany({
    where: { projectId: { in: projectIds }, user: { role: "marketer" } },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const data = contracts.map((contract) => ({
    id: contract.id,
    projectId: contract.projectId,
    projectName: contract.project.name,
    userId: contract.userId,
    userName: contract.user.name,
    userEmail: contract.user.email,
    userRole: contract.user.role,
    commissionPercent: Number(contract.commissionPercent),
    status: contract.status.toLowerCase(),
    createdAt: contract.createdAt,
  }));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const parsed = createContractInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const [marketer, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, name: true, email: true },
    }),
    prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { id: true, name: true },
    }),
  ]);

  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const existing = await prisma.contract.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.userId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Contract already exists" },
      { status: 409 },
    );
  }

  const commissionPercent = normalizePercent(payload.commissionPercent);

  const contract = await prisma.contract.create({
    data: {
      projectId: project.id,
      userId: marketer.id,
      commissionPercent: commissionPercent.toString(),
    },
  });

  return NextResponse.json(
    {
      data: {
        id: contract.id,
        projectId: contract.projectId,
        projectName: project.name,
        userId: contract.userId,
        userName: marketer.name,
        userEmail: marketer.email,
        userRole: marketer.role,
        commissionPercent: Number(contract.commissionPercent),
        status: contract.status.toLowerCase(),
        createdAt: contract.createdAt,
      },
    },
    { status: 201 },
  );
}
