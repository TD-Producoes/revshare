import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; keyId: string }> },
) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { projectId, keyId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== authUser.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const existing = await prisma.attributionAppKey.findFirst({
    where: { id: keyId, projectId },
    select: { id: true, name: true, createdAt: true, revokedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  const revokedAt = existing.revokedAt ?? new Date();
  const record = await prisma.attributionAppKey.update({
    where: { id: keyId },
    data: {
      revokedAt,
      keyCipherText: null,
      keyIv: null,
      keyTag: null,
    },
    select: { id: true, name: true, createdAt: true, revokedAt: true },
  });

  return NextResponse.json({ data: record });
}
