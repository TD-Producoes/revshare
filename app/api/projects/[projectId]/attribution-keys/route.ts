import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1).max(1000).optional(),
});

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { projectId } = await params;
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

  const keys = await prisma.attributionAppKey.findMany({
    where: { projectId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: keys });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId } = await params;
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

  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = hashKey(rawKey);

  const encrypted = encryptSecret(rawKey);
  const record = await prisma.attributionAppKey.create({
    data: {
      projectId,
      keyHash,
      keyCipherText: encrypted.cipherText,
      keyIv: encrypted.iv,
      keyTag: encrypted.tag,
      name: parsed.data.name?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: {
      ...record,
      key: rawKey,
    },
  });
}
