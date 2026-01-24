import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const querySchema = z.object({
  projectId: z.string().min(1),
  marketerId: z.string().min(1),
});

function getIpAddress(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  ).trim();
}

function parseOsVersion(userAgent: string) {
  const iosMatch = userAgent.match(/OS ([\d_]+)/i);
  if (iosMatch) {
    return iosMatch[1].replace(/_/g, ".");
  }
  const androidMatch = userAgent.match(/Android ([\d.]+)/i);
  if (androidMatch) {
    return androidMatch[1];
  }
  const windowsMatch = userAgent.match(/Windows NT ([\d.]+)/i);
  if (windowsMatch) {
    return `Windows ${windowsMatch[1]}`;
  }
  const macMatch = userAgent.match(/Mac OS X ([\d_]+)/i);
  if (macMatch) {
    return `macOS ${macMatch[1].replace(/_/g, ".")}`;
  }
  return "unknown";
}

function normalizeModel(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "?") return null;
  return trimmed.replace(/^"|"$/g, "");
}

function parseDeviceModel(userAgent: string, headers: Headers) {
  const modelHeader = normalizeModel(headers.get("sec-ch-ua-model"));
  if (modelHeader) {
    return modelHeader;
  }
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) {
    const androidMatch = userAgent.match(/Android [\d.]+; ([^;\)]+)/i);
    if (androidMatch) {
      return androidMatch[1].trim();
    }
    return "Android";
  }
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows PC";
  return "unknown";
}

function detectPlatform(userAgent: string) {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

function getLocale(headers: Headers) {
  const language = headers.get("accept-language");
  if (!language) return null;
  return language.split(",")[0]?.trim() || null;
}

function hashFingerprint(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    projectId: url.searchParams.get("projectId"),
    marketerId: url.searchParams.get("marketerId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders },
    );
  }

  const { projectId, marketerId } = parsed.data;
  const [project, contract] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, appStoreUrl: true, playStoreUrl: true },
    }),
    prisma.contract.findUnique({
      where: { projectId_userId: { projectId, userId: marketerId } },
      select: { status: true },
    }),
  ]);

  if (!project || contract?.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Invalid project or marketer" },
      { status: 404, headers: corsHeaders },
    );
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const ipAddress = getIpAddress(request.headers);
  const deviceModel = parseDeviceModel(userAgent, request.headers);
  const osVersion = parseOsVersion(userAgent);
  const platform = detectPlatform(userAgent);
  const locale = getLocale(request.headers);
  const fingerprintHash = hashFingerprint(
    `${ipAddress}|${deviceModel}|${osVersion}`,
  );

  const fingerprintKey = {
    projectId,
    ipAddress,
    deviceModel,
    osVersion,
  };

  const existing = await prisma.attributionInstallFingerprint.findUnique({
    where: { projectId_ipAddress_deviceModel_osVersion: fingerprintKey },
    select: { id: true },
  });

  if (!existing) {
    await prisma.attributionInstallFingerprint.create({
      data: {
        ...fingerprintKey,
        marketerId,
        platform,
        locale,
        userAgent,
      },
    });
  }

  await prisma.attributionClick.upsert({
    where: {
      projectId_marketerId_deviceId: {
        projectId,
        marketerId,
        deviceId: `click:${fingerprintHash}`,
      },
    },
    update: {},
    create: {
      projectId,
      marketerId,
      deviceId: `click:${fingerprintHash}`,
      url: request.url,
    },
  });

  const redirectUrl =
    platform === "ios"
      ? project.appStoreUrl
      : platform === "android"
        ? project.playStoreUrl
        : null;

  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
