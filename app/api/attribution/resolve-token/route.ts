import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const resolveTokenSchema = z.object({
  appKey: z.string().min(10),
  token: z.string().min(1).max(100),
});

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const parsed = resolveTokenSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders }
    );
  }

  const { appKey, token } = parsed.data;

  // Validate app key
  const keyHash = hashKey(appKey);
  const keyRecord = await prisma.attributionAppKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { projectId: true },
  });

  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid app key" },
      { status: 401, headers: corsHeaders }
    );
  }

  // Find token (within 7 days, not already resolved, matching project)
  const timeWindowMs = 7 * 24 * 60 * 60 * 1000;
  const minCreatedAt = new Date(Date.now() - timeWindowMs);

  const tokenRecord = await prisma.attributionDeferredToken.findFirst({
    where: {
      token,
      projectId: keyRecord.projectId,
      resolvedAt: null,
      createdAt: { gte: minCreatedAt },
    },
    select: { id: true, marketerId: true },
  });

  if (!tokenRecord) {
    return NextResponse.json(
      { ok: true, marketerId: null },
      { headers: corsHeaders }
    );
  }

  // Mark token as resolved
  await prisma.attributionDeferredToken.update({
    where: { id: tokenRecord.id },
    data: { resolvedAt: new Date() },
  });

  // Record the install
  await prisma.attributionClick.upsert({
    where: {
      projectId_marketerId_deviceId: {
        projectId: keyRecord.projectId,
        marketerId: tokenRecord.marketerId,
        deviceId: `install:token:${token.slice(0, 16)}`,
      },
    },
    update: {},
    create: {
      projectId: keyRecord.projectId,
      marketerId: tokenRecord.marketerId,
      deviceId: `install:token:${token.slice(0, 16)}`,
    },
  });

  return NextResponse.json(
    { ok: true, marketerId: tokenRecord.marketerId },
    { headers: corsHeaders }
  );
}
