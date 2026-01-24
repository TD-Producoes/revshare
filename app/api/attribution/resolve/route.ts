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

const resolveSchema = z.object({
  appKey: z.string().min(10),
  deviceModel: z.string().min(1).max(200),
  osVersion: z.string().min(1).max(100),
  ipAddress: z.string().min(1).max(100).optional(),
  platform: z.string().min(1).max(50).optional(),
  locale: z.string().min(1).max(20).optional(),
  userAgent: z.string().min(1).max(500).optional(),
});

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function hashFingerprint(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getIpAddress(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    ""
  ).trim();
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const parsed = resolveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders },
    );
  }

  const payload = parsed.data;
  const ipAddress = payload.ipAddress || getIpAddress(request.headers);
  if (!ipAddress) {
    return NextResponse.json(
      { error: "Missing IP address" },
      { status: 400, headers: corsHeaders },
    );
  }

  const keyHash = hashKey(payload.appKey);
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

  const fingerprintWhere = {
    projectId: keyRecord.projectId,
    ipAddress,
    deviceModel: payload.deviceModel,
    osVersion: payload.osVersion,
    ...(payload.platform ? { platform: payload.platform } : {}),
    ...(payload.locale ? { locale: payload.locale } : {}),
  };

  const fingerprint = await prisma.attributionInstallFingerprint.findFirst({
    where: fingerprintWhere,
    orderBy: { createdAt: "desc" },
    select: { marketerId: true },
  });

  if (fingerprint?.marketerId) {
    const fingerprintHash = hashFingerprint(
      `${ipAddress}|${payload.deviceModel}|${payload.osVersion}`,
    );
    await prisma.attributionClick.upsert({
      where: {
        projectId_marketerId_deviceId: {
          projectId: keyRecord.projectId,
          marketerId: fingerprint.marketerId,
          deviceId: `install:${fingerprintHash}`,
        },
      },
      update: {},
      create: {
        projectId: keyRecord.projectId,
        marketerId: fingerprint.marketerId,
        deviceId: `install:${fingerprintHash}`,
      },
    });
  }

  return NextResponse.json(
    { ok: true, marketerId: fingerprint?.marketerId ?? null },
    { headers: corsHeaders },
  );
}
