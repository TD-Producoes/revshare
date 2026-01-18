import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(
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

  const keyRecord = await prisma.attributionAppKey.findFirst({
    where: { id: keyId, projectId },
    select: {
      keyCipherText: true,
      keyIv: true,
      keyTag: true,
      revokedAt: true,
    },
  });

  if (!keyRecord || keyRecord.revokedAt) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }
  if (!keyRecord.keyCipherText || !keyRecord.keyIv || !keyRecord.keyTag) {
    return NextResponse.json(
      { error: "Key cannot be revealed" },
      { status: 400 },
    );
  }

  const key = decryptSecret(
    keyRecord.keyCipherText,
    keyRecord.keyIv,
    keyRecord.keyTag,
  );

  return NextResponse.json({ data: { key } });
}
