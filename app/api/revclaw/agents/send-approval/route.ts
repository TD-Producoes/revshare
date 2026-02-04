import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAgentSecret } from "@/lib/revclaw/secret";
import { notifyUserForApproval } from "@/lib/revclaw/approval";

/**
 * POST /api/revclaw/agents/send-approval
 *
 * Sends an approval button to a Telegram user for a pending registration.
 * This endpoint is called by the bot after registration to trigger the human approval flow.
 *
 * Authentication: agent_id + agent_secret (bot-held credentials)
 */

const inputSchema = z.object({
  agent_id: z.string().min(1),
  agent_secret: z.string().min(1),
  claim_id: z.string().min(1),
  telegram_chat_id: z.string().min(1), // The Telegram chat ID to send the button to
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { agent_id, agent_secret, claim_id, telegram_chat_id } = parsed.data;

  // 1. Find the agent and verify secret
  const agent = await prisma.revclawAgent.findUnique({
    where: { id: agent_id },
    select: {
      id: true,
      name: true,
      agentSecretHash: true,
      status: true,
      manifestSnapshot: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Verify agent_secret
  if (!verifyAgentSecret(agent_secret, agent.agentSecretHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Check agent status
  if (agent.status !== "ACTIVE") {
    return NextResponse.json({ error: "Agent is not active" }, { status: 403 });
  }

  // 2. Find the registration
  const registration = await prisma.revclawRegistration.findUnique({
    where: { claimId: claim_id },
    select: {
      id: true,
      agentId: true,
      status: true,
      requestedScopes: true,
      expiresAt: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Verify the registration belongs to this agent
  if (registration.agentId !== agent_id) {
    return NextResponse.json(
      { error: "Registration does not belong to this agent" },
      { status: 403 }
    );
  }

  // Check registration status
  if (registration.status !== "PENDING") {
    return NextResponse.json(
      { error: `Registration is ${registration.status.toLowerCase()}` },
      { status: 400 }
    );
  }

  // Check if expired
  if (registration.expiresAt < new Date()) {
    await prisma.revclawRegistration.update({
      where: { id: registration.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Registration has expired" }, { status: 410 });
  }

  // 3. Send the approval button
  // Extract a preview from the manifest (first few lines, skip frontmatter)
  let manifestPreview: string | undefined;
  if (agent.manifestSnapshot) {
    const lines = agent.manifestSnapshot.split("\n");
    const contentLines = lines.filter(
      (line) => !line.startsWith("---") && !line.startsWith("#") && line.trim()
    );
    manifestPreview = contentLines.slice(0, 3).join(" ").slice(0, 200);
  }

  const result = await notifyUserForApproval({
    telegramChatId: telegram_chat_id,
    agentName: agent.name,
    agentId: agent.id,
    claimId: claim_id,
    requestedScopes: registration.requestedScopes,
    expiresAt: registration.expiresAt,
    manifestPreview,
  });

  if (!result.ok) {
    console.error("[RevClaw] Failed to send approval button:", result.error);
    return NextResponse.json(
      { error: "Failed to send approval message", details: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Approval request sent",
    expires_at: registration.expiresAt.toISOString(),
  });
}
