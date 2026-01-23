import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";

export const runtime = "nodejs";

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v2";

async function getIntegration(projectId: string) {
  return prisma.projectIntegration.findUnique({
    where: { projectId_provider: { projectId, provider: "REVENUECAT" } },
    select: {
      projectId: true,
      externalId: true,
      apiKeyCipherText: true,
      apiKeyIv: true,
      apiKeyTag: true,
      webhookSecretCipherText: true,
      webhookSecretIv: true,
      webhookSecretTag: true,
    },
  });
}

async function fetchRevenueCat(
  url: string,
  apiKey: string,
  init?: RequestInit,
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      payload,
      text: payload?.message ?? "RevenueCat request failed",
    };
  }
  return { ok: true, payload };
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

  const integration = await getIntegration(projectId);
  if (!integration?.externalId) {
    return NextResponse.json(
      { error: "RevenueCat integration not found" },
      { status: 404 },
    );
  }

  const apiKey = decryptSecret(
    integration.apiKeyCipherText,
    integration.apiKeyIv,
    integration.apiKeyTag,
  );

  const url = `${REVENUECAT_API_BASE}/projects/${integration.externalId}/integrations/webhooks`;
  const result = await fetchRevenueCat(url, apiKey);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.text, details: result.payload },
      { status: result.status },
    );
  }

  return NextResponse.json({ data: result.payload });
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

  const integration = await getIntegration(projectId);
  if (!integration?.externalId) {
    return NextResponse.json(
      { error: "RevenueCat integration not found" },
      { status: 404 },
    );
  }

  const apiKey = decryptSecret(
    integration.apiKeyCipherText,
    integration.apiKeyIv,
    integration.apiKeyTag,
  );
  const webhookSecret = decryptSecret(
    integration.webhookSecretCipherText,
    integration.webhookSecretIv,
    integration.webhookSecretTag,
  );

  const origin = process.env.BASE_URL ?? new URL(request.url).origin;
  const webhookUrl = `${origin}/api/revenuecat/webhook/${integration.externalId}`;
  const body = {
    name: "Creator Marketplace Webhook",
    url: webhookUrl,
    authorization_header: `Bearer ${webhookSecret}`,
  };

  const url = `${REVENUECAT_API_BASE}/projects/${integration.externalId}/integrations/webhooks`;
  const result = await fetchRevenueCat(url, apiKey, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.text, details: result.payload, body },
      { status: result.status },
    );
  }

  return NextResponse.json({ data: result.payload });
}
