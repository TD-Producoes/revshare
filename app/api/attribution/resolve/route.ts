import { NextResponse, userAgent } from "next/server";
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

// Extract stable UA parts that match between Safari and WebView
// e.g. "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15"
function parseBaseUserAgent(userAgent: string) {
  const match = userAgent.match(
    /^Mozilla\/[\d.]+ \([^)]+\) AppleWebKit\/[\d.]+/i
  );
  return match?.[0] ?? null;
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

  // Only match fingerprints created within the last 7 days
  const timeWindowMs = 7 * 24 * 60 * 60 * 1000;
  const minCreatedAt = new Date(Date.now() - timeWindowMs);

  const fingerprintWhere = {
    projectId: keyRecord.projectId,
    ipAddress,
    deviceModel: payload.deviceModel,
    osVersion: payload.osVersion,
    createdAt: { gte: minCreatedAt },
    ...(payload.platform ? { platform: payload.platform } : {}),
  };

  const requestUserAgent = request.headers.get("user-agent");
  console.log("tiago Request User-Agent:", requestUserAgent);
  console.log("tiago Fingerprint where:", fingerprintWhere);

  const fingerprint = await prisma.attributionInstallFingerprint.findFirst({
    where: fingerprintWhere,
    orderBy: { createdAt: "desc" },
    select: { marketerId: true, userAgent: true },
  });

  console.log("tiago Fingerprint found:", fingerprint);

  // Validate userAgent base matches (Safari vs WebView stable parts)
  let validatedMarketerId: string | null = null;
  if (fingerprint?.marketerId) {
    const storedBaseUA = fingerprint.userAgent
      ? parseBaseUserAgent(fingerprint.userAgent)
      : null;
    const payloadBaseUA = payload.userAgent
      ? parseBaseUserAgent(payload.userAgent)
      : null;

    console.log("tiago Stored base UA:", storedBaseUA);
    console.log("tiago Payload base UA:", payloadBaseUA);

    // If both have UA, they must match. If either is missing, skip UA validation.
    if (storedBaseUA && payloadBaseUA) {
      if (storedBaseUA === payloadBaseUA) {
        validatedMarketerId = fingerprint.marketerId;
      } else {
        console.log("tiago UA mismatch - rejecting fingerprint");
      }
    } else {
      // No UA to compare, trust the other fingerprint fields
      validatedMarketerId = fingerprint.marketerId;
    }
  }

  if (validatedMarketerId) {
    const fingerprintHash = hashFingerprint(
      `${ipAddress}|${payload.deviceModel}|${payload.osVersion}`,
    );
    await prisma.attributionClick.upsert({
      where: {
        projectId_marketerId_deviceId: {
          projectId: keyRecord.projectId,
          marketerId: validatedMarketerId,
          deviceId: `install:${fingerprintHash}`,
        },
      },
      update: {},
      create: {
        projectId: keyRecord.projectId,
        marketerId: validatedMarketerId,
        deviceId: `install:${fingerprintHash}`,
      },
    });
  }

  return NextResponse.json(
    { ok: true, marketerId: validatedMarketerId },
    { headers: corsHeaders },
  );
}
