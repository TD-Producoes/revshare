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

const clickSchema = z.object({
  appKey: z.string().min(10),
  marketerId: z.string().min(1),
  deviceId: z.string().min(1).max(200),
  url: z.string().url().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const parsed = clickSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders },
    );
  }

  const { appKey, marketerId, deviceId, url } = parsed.data;
  const keyHash = hashKey(appKey);

  const keyRecord = await prisma.attributionAppKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { projectId: true },
  });

  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid app key" },
      { status: 401, headers: corsHeaders },
    );
  }

  const result = await prisma.attributionClick.upsert({
    where: {
      projectId_marketerId_deviceId: {
        projectId: keyRecord.projectId,
        marketerId,
        deviceId,
      },
    },
    create: {
      projectId: keyRecord.projectId,
      marketerId,
      deviceId,
      url,
    },
    update: {},
    select: { id: true },
  });

  return NextResponse.json(
    { ok: true, clickId: result.id },
    { headers: corsHeaders },
  );
}
