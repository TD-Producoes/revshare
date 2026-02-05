import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAgentSecret } from "@/lib/revclaw/secret";
import { extractBearerToken, generateExchangeCode } from "@/lib/revclaw/tokens";

/**
 * GET /api/revclaw/agents/:agentId/claim-status
 *
 * Bot-authenticated using agent_secret in Authorization header:
 *   Authorization: Bearer <agent_secret>
 *
 * Returns:
 * - { status: "pending" }
 * - { status: "expired" }
 * - { status: "claimed", exchange_code: "..." }
 *
 * Notes:
 * - Exchange codes are generated here (on first successful claimed poll) so we never store plaintext.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;

  const authHeader = request.headers.get("Authorization");
  const agentSecret = extractBearerToken(authHeader);
  if (!agentSecret) {
    return NextResponse.json(
      { error: "Missing Authorization bearer token" },
      { status: 401 },
    );
  }

  const agent = await prisma.revclawAgent.findUnique({
    where: { id: agentId },
    select: { id: true, agentSecretHash: true, status: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (!verifyAgentSecret(agentSecret, agent.agentSecretHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (agent.status !== "ACTIVE") {
    return NextResponse.json({ error: "Agent is not active" }, { status: 403 });
  }

  // Latest registration for this agent
  const registration = await prisma.revclawRegistration.findFirst({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      expiresAt: true,
      claimedByUserId: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }

  if (registration.status === "PENDING") {
    if (registration.expiresAt < new Date()) {
      return NextResponse.json({ status: "expired" }, { status: 200 });
    }
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }

  if (registration.status !== "CLAIMED") {
    return NextResponse.json(
      { status: registration.status.toLowerCase() },
      { status: 200 },
    );
  }

  // Find installation for this agent+user
  const installation = await prisma.revclawInstallation.findUnique({
    where: {
      agentId_userId: {
        agentId: agent.id,
        userId: registration.claimedByUserId ?? "",
      },
    },
    select: {
      id: true,
      grantedScopes: true,
    },
  });

  if (!installation) {
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }

  // Create one exchange code if none pending
  const existing = await prisma.revclawExchangeCode.findFirst({
    where: {
      installationId: installation.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const code = generateExchangeCode();

  if (!existing) {
    await prisma.revclawExchangeCode.create({
      data: {
        installationId: installation.id,
        codeHash: code.code_hash,
        scopesSnapshot: installation.grantedScopes,
        status: "PENDING",
        expiresAt: code.expires_at,
      },
    });
  }

  return NextResponse.json(
    {
      status: "claimed",
      user_id: registration.claimedByUserId,
      installation_id: installation.id,
      granted_scopes: installation.grantedScopes,
      exchange_code: code.code,
    },
    { status: 200 },
  );
}
