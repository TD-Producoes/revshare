import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

function createShortCode() {
  const raw = crypto.randomBytes(6).toString("base64url");
  const compact = raw.replace(/[^a-zA-Z0-9]/g, "");
  return compact.slice(0, 6) || raw.slice(0, 6);
}

async function createUniqueShortLink(projectId: string, marketerId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createShortCode();
    try {
      return await prisma.attributionShortLink.create({
        data: { projectId, marketerId, code },
        select: { code: true },
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unable to create attribution link");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  let authUser;
  try {
    authUser = await requireAuthUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { projectId } = await params;
  const marketerId = authUser.id;

  const [marketer, contract] = await Promise.all([
    prisma.user.findUnique({
      where: { id: marketerId },
      select: { role: true },
    }),
    prisma.contract.findUnique({
      where: { projectId_userId: { projectId, userId: marketerId } },
      select: { status: true },
    }),
  ]);

  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  if (contract?.status !== "APPROVED") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const existing = await prisma.attributionShortLink.findUnique({
    where: { projectId_marketerId: { projectId, marketerId } },
    select: { code: true },
  });

  const record = existing ?? (await createUniqueShortLink(projectId, marketerId));
  const origin = new URL(request.url).origin;
  const url = `${origin}/a/${record.code}`;

  return NextResponse.json({ data: { code: record.code, url } });
}
