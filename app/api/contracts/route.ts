import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { notificationMessages } from "@/lib/notifications/messages";
import { createClient } from "@/lib/supabase/server";

const createContractInput = z.object({
  projectId: z.string().min(1),
  commissionPercent: z.number().min(0).max(100),
  message: z.string().max(2000).optional(),
  refundWindowDays: z.number().int().min(0).max(3650).optional(),
});

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

function matchesPercent(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

export async function GET(request: Request) {
  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  // Get authenticated user details
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If user is marketer, return their contracts
  if (user.role === "marketer") {
    const contracts = await prisma.contract.findMany({
      where: { userId: user.id, user: { role: "marketer" } },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            marketerCommissionPercent: true,
            refundWindowDays: true,
          },
        },
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
      message: contract.message,
      projectCommissionPercent: Number(contract.project.marketerCommissionPercent),
      refundWindowDays: contract.refundWindowDays,
      projectRefundWindowDays: contract.project.refundWindowDays,
      status: contract.status.toLowerCase(),
      createdAt: contract.createdAt,
    }));

    return NextResponse.json({ data });
  }

  // If user is creator, return contracts for their projects
  if (user.role !== "creator") {
    return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
  }

  const creatorProjects = await prisma.project.findMany({
    where: { userId: user.id },
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
      project: {
        select: {
          id: true,
          name: true,
          marketerCommissionPercent: true,
          refundWindowDays: true,
        },
      },
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
    message: contract.message,
    projectCommissionPercent: Number(contract.project.marketerCommissionPercent),
    refundWindowDays: contract.refundWindowDays,
    projectRefundWindowDays: contract.project.refundWindowDays,
    status: contract.status.toLowerCase(),
    createdAt: contract.createdAt,
  }));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createContractInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const [marketer, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        stripeConnectedAccountId: true,
      },
    }),
    prisma.project.findUnique({
      where: { id: payload.projectId },
      select: {
        id: true,
        name: true,
        userId: true,
        refundWindowDays: true,
        marketerCommissionPercent: true,
        autoApproveApplications: true,
        autoApproveMatchTerms: true,
        autoApproveVerifiedOnly: true,
      },
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
        userId: authUser.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Contract already exists" },
      { status: 409 }
    );
  }

  const commissionPercent = normalizePercent(payload.commissionPercent);

  const requiresMatchingTerms = project.autoApproveMatchTerms;
  const requiresVerifiedMarketer = project.autoApproveVerifiedOnly;
  const hasMatchingCommission = matchesPercent(
    commissionPercent,
    Number(project.marketerCommissionPercent)
  );
  const requestedRefundWindow =
    payload.refundWindowDays ?? project.refundWindowDays;
  const hasMatchingRefundWindow =
    requestedRefundWindow === project.refundWindowDays;
  const hasVerifiedMarketer = Boolean(marketer.stripeConnectedAccountId);
  const shouldAutoApprove = project.autoApproveApplications
    ? (!requiresMatchingTerms ||
        (hasMatchingCommission && hasMatchingRefundWindow)) &&
      (!requiresVerifiedMarketer || hasVerifiedMarketer)
    : false;

  const contract = await prisma.$transaction(async (tx) => {
    const createdContract = await tx.contract.create({
      data: {
        projectId: project.id,
        userId: marketer.id,
        commissionPercent: commissionPercent.toString(),
        message: payload.message?.trim() || null,
        refundWindowDays:
          payload.refundWindowDays !== undefined ? payload.refundWindowDays : null,
        status: shouldAutoApprove ? "APPROVED" : "PENDING",
      },
    });

    await tx.event.create({
      data: {
        type: "CONTRACT_CREATED",
        actorId: marketer.id,
        projectId: project.id,
        subjectType: "Contract",
        subjectId: createdContract.id,
        data: {
          projectId: project.id,
          contractStatus: shouldAutoApprove ? "APPROVED" : "PENDING",
          marketerId: marketer.id,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: project.userId,
        type: "SYSTEM",
        ...notificationMessages.contractApplied(
          marketer.name ?? "A marketer",
          project.name,
        ),
        data: {
          projectId: project.id,
          marketerId: marketer.id,
          contractId: createdContract.id,
        },
      },
    });

    return createdContract;
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
        message: contract.message,
        projectCommissionPercent: Number(project.marketerCommissionPercent),
        refundWindowDays: contract.refundWindowDays,
        projectRefundWindowDays: project.refundWindowDays,
        status: contract.status.toLowerCase(),
        createdAt: contract.createdAt,
      },
    },
    { status: 201 }
  );
}
