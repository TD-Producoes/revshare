import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import crypto from "crypto";

const connectSchema = z.object({
  revenueCatProjectId: z.string().min(1),
  apiKey: z.string().min(1),
});

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

  const parsed = connectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, creatorStripeAccountId: true },
  });

  if (!project || project.userId !== authUser.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.creatorStripeAccountId) {
    return NextResponse.json(
      { error: "Stripe is connected. Disconnect it before using RevenueCat." },
      { status: 400 },
    );
  }

  const { apiKey, revenueCatProjectId } = parsed.data;
  const encrypted = encryptSecret(apiKey);
  const webhookSecret = crypto.randomBytes(32).toString("hex");
  const encryptedWebhookSecret = encryptSecret(webhookSecret);

  const integration = await prisma.projectIntegration.upsert({
    where: {
      projectId_provider: { projectId, provider: "REVENUECAT" },
    },
    create: {
      projectId,
      provider: "REVENUECAT",
      externalId: revenueCatProjectId,
      apiKeyCipherText: encrypted.cipherText,
      apiKeyIv: encrypted.iv,
      apiKeyTag: encrypted.tag,
      webhookSecretCipherText: encryptedWebhookSecret.cipherText,
      webhookSecretIv: encryptedWebhookSecret.iv,
      webhookSecretTag: encryptedWebhookSecret.tag,
    },
    update: {
      externalId: revenueCatProjectId,
      apiKeyCipherText: encrypted.cipherText,
      apiKeyIv: encrypted.iv,
      apiKeyTag: encrypted.tag,
      webhookSecretCipherText: encryptedWebhookSecret.cipherText,
      webhookSecretIv: encryptedWebhookSecret.iv,
      webhookSecretTag: encryptedWebhookSecret.tag,
    },
    select: { externalId: true },
  });

  return NextResponse.json({
    data: {
      revenueCatProjectId: integration.externalId,
      revenueCatConnected: true,
      webhookSecret,
    },
  });
}

export async function DELETE(
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
    select: { id: true, userId: true },
  });

  if (!project || project.userId !== authUser.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.projectIntegration.deleteMany({
    where: { projectId, provider: "REVENUECAT" },
  });

  return NextResponse.json({ data: { revenueCatConnected: false } });
}
