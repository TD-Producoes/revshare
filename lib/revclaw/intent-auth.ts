/**
 * RevClaw Intent Authentication & Authorization
 *
 * Provides utilities for:
 * - Bot authentication via agent_secret header
 * - Intent verification and enforcement
 * - Audit logging for bot actions
 */

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAgentSecret } from "./secret";
import { hashPayload, computeAuditLogHash } from "./crypto";

// =============================================================================
// Bot Authentication
// =============================================================================

export interface BotAuthContext {
  agentId: string;
  agentName: string;
  installationId: string;
  userId: string;
  grantedScopes: string[];
  installation: {
    requireApprovalForPublish: boolean;
    requireApprovalForApply: boolean;
    dailyApplyLimit: number | null;
    allowedCategories: string[];
  };
}

export type BotAuthResult =
  | { success: true; context: BotAuthContext }
  | { success: false; error: string; status: number; code: string };

/**
 * Authenticate a bot request using agent_secret from Authorization header.
 *
 * Expected header format: `Authorization: Bearer <agent_secret>`
 *
 * This validates:
 * 1. Agent secret matches a registered agent
 * 2. Agent is active
 * 3. An active installation exists for agent + user
 */
export async function authenticateBot(
  request: NextRequest | Request,
  targetUserId?: string
): Promise<BotAuthResult> {
  // Extract Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Missing or invalid Authorization header",
      status: 401,
      code: "auth_required",
    };
  }

  const agentSecret = authHeader.slice(7); // Remove "Bearer "
  if (!agentSecret) {
    return {
      success: false,
      error: "Empty agent secret",
      status: 401,
      code: "auth_required",
    };
  }

  // Find agents and verify secret (we need to check all agents since we don't have agent_id)
  // In production, this could be optimized with a cache or by requiring agent_id in a header
  const agents = await prisma.revclawAgent.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      agentSecretHash: true,
    },
  });

  let matchedAgent: { id: string; name: string } | null = null;
  for (const agent of agents) {
    if (verifyAgentSecret(agentSecret, agent.agentSecretHash)) {
      matchedAgent = { id: agent.id, name: agent.name };
      break;
    }
  }

  if (!matchedAgent) {
    return {
      success: false,
      error: "Invalid agent credentials",
      status: 401,
      code: "invalid_credentials",
    };
  }

  // Find installation for this agent + user
  // If targetUserId is provided, use it; otherwise, require X-RevClaw-User-Id header
  let userId = targetUserId;
  if (!userId) {
    userId = request.headers.get("X-RevClaw-User-Id") ?? undefined;
  }

  if (!userId) {
    return {
      success: false,
      error: "Missing X-RevClaw-User-Id header",
      status: 400,
      code: "user_id_required",
    };
  }

  const installation = await prisma.revclawInstallation.findUnique({
    where: {
      agentId_userId: {
        agentId: matchedAgent.id,
        userId,
      },
    },
    select: {
      id: true,
      status: true,
      grantedScopes: true,
      requireApprovalForPublish: true,
      requireApprovalForApply: true,
      dailyApplyLimit: true,
      allowedCategories: true,
    },
  });

  if (!installation) {
    return {
      success: false,
      error: "No installation found for this agent and user",
      status: 403,
      code: "installation_not_found",
    };
  }

  if (installation.status !== "ACTIVE") {
    return {
      success: false,
      error: `Installation is ${installation.status.toLowerCase()}`,
      status: 403,
      code: "installation_inactive",
    };
  }

  return {
    success: true,
    context: {
      agentId: matchedAgent.id,
      agentName: matchedAgent.name,
      installationId: installation.id,
      userId,
      grantedScopes: installation.grantedScopes,
      installation: {
        requireApprovalForPublish: installation.requireApprovalForPublish,
        requireApprovalForApply: installation.requireApprovalForApply,
        dailyApplyLimit: installation.dailyApplyLimit,
        allowedCategories: installation.allowedCategories,
      },
    },
  };
}

// =============================================================================
// Intent Verification
// =============================================================================

export type IntentKind =
  | "PROJECT_PUBLISH"
  | "APPLICATION_SUBMIT"
  | "COUPON_TEMPLATE_CREATE"
  | "REWARD_CREATE"
  | "PLAN_EXECUTE";

export interface IntentVerification {
  intentId: string;
  installationId: string;
  agentId: string;
  userId: string;
  kind: IntentKind;
  payloadHash: string;
  status: string;
  expiresAt: Date;
  executedAt: Date | null;
}

export type IntentVerificationResult =
  | { valid: true; intent: IntentVerification }
  | { valid: false; error: string; code: string };

/**
 * Verify an intent can be used for execution.
 *
 * Checks:
 * - Intent exists
 * - Intent belongs to the correct installation
 * - Intent is APPROVED
 * - Intent has not expired
 * - Intent has not been executed (single-use)
 * - Payload hash matches (if provided)
 */
export async function verifyIntent(
  intentId: string,
  installationId: string,
  expectedKind: IntentKind,
  payloadToVerify?: unknown
): Promise<IntentVerificationResult> {
  const intent = await prisma.revclawIntent.findUnique({
    where: { id: intentId },
    select: {
      id: true,
      installationId: true,
      agentId: true,
      onBehalfOfUserId: true,
      kind: true,
      payloadHash: true,
      status: true,
      expiresAt: true,
      executedAt: true,
    },
  });

  if (!intent) {
    return { valid: false, error: "Intent not found", code: "intent_not_found" };
  }

  // Check installation matches
  if (intent.installationId !== installationId) {
    return {
      valid: false,
      error: "Intent does not belong to this installation",
      code: "intent_wrong_installation",
    };
  }

  // Check kind matches
  if (intent.kind !== expectedKind) {
    return {
      valid: false,
      error: `Intent is for ${intent.kind}, not ${expectedKind}`,
      code: "intent_wrong_kind",
    };
  }

  // Check status
  if (intent.status !== "APPROVED") {
    if (intent.status === "PENDING_APPROVAL") {
      return { valid: false, error: "Intent is pending approval", code: "intent_pending" };
    }
    if (intent.status === "DENIED") {
      return { valid: false, error: "Intent was denied", code: "intent_denied" };
    }
    if (intent.status === "EXPIRED") {
      return { valid: false, error: "Intent has expired", code: "intent_expired" };
    }
    if (intent.status === "EXECUTED") {
      return { valid: false, error: "Intent has already been used", code: "intent_already_used" };
    }
    return { valid: false, error: `Invalid intent status: ${intent.status}`, code: "intent_invalid_status" };
  }

  // Check expiration
  if (intent.expiresAt < new Date()) {
    // Update status to expired
    await prisma.revclawIntent.update({
      where: { id: intent.id },
      data: { status: "EXPIRED" },
    });
    return { valid: false, error: "Intent has expired", code: "intent_expired" };
  }

  // Check single-use
  if (intent.executedAt) {
    return { valid: false, error: "Intent has already been executed", code: "intent_already_used" };
  }

  // Verify payload hash if provided
  if (payloadToVerify !== undefined) {
    const computedHash = hashPayload(payloadToVerify);
    if (computedHash !== intent.payloadHash) {
      return {
        valid: false,
        error: "Payload does not match intent",
        code: "intent_payload_mismatch",
      };
    }
  }

  return {
    valid: true,
    intent: {
      intentId: intent.id,
      installationId: intent.installationId,
      agentId: intent.agentId,
      userId: intent.onBehalfOfUserId,
      kind: intent.kind as IntentKind,
      payloadHash: intent.payloadHash,
      status: intent.status,
      expiresAt: intent.expiresAt,
      executedAt: intent.executedAt,
    },
  };
}

/**
 * Mark an intent as executed (single-use enforcement).
 */
export async function markIntentExecuted(
  intentId: string,
  result: { success: boolean; error?: string; data?: unknown }
): Promise<void> {
  await prisma.revclawIntent.update({
    where: { id: intentId },
    data: {
      status: "EXECUTED",
      executedAt: new Date(),
      executionResult: result as object,
    },
  });
}

// =============================================================================
// Audit Logging
// =============================================================================

export interface AuditLogParams {
  agentId: string | null;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId?: string;
  idempotencyKey?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
}

/**
 * Create a tamper-evident audit log entry with hash chaining.
 */
export async function createAuditLog(params: AuditLogParams): Promise<string> {
  // Get the previous entry for hash chaining
  const previousEntry = await prisma.auditLog.findFirst({
    orderBy: { sequence: "desc" },
    select: { entryHash: true },
  });

  const previousHash = previousEntry?.entryHash ?? null;

  // Create the entry
  const now = new Date();
  const entry = await prisma.auditLog.create({
    data: {
      performedByAgentId: params.agentId,
      onBehalfOfUserId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      requestId: params.requestId,
      idempotencyKey: params.idempotencyKey,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      payload: params.payload as object | undefined,
      previousHash,
      entryHash: "", // Placeholder, will update
      createdAt: now,
    },
  });

  // Compute the hash with the sequence
  const entryHash = computeAuditLogHash({
    sequence: entry.sequence,
    previousHash,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    createdAt: now,
    payload: params.payload,
  });

  // Update with the computed hash
  await prisma.auditLog.update({
    where: { id: entry.id },
    data: { entryHash },
  });

  return entry.id;
}

// =============================================================================
// Response Helpers
// =============================================================================

export function botAuthErrorResponse(result: BotAuthResult): NextResponse {
  if (result.success) {
    throw new Error("Cannot create error response for successful auth");
  }
  return NextResponse.json(
    { error: result.error, code: result.code },
    { status: result.status }
  );
}

export function intentErrorResponse(
  result: IntentVerificationResult,
  status: number = 403
): NextResponse {
  if (result.valid) {
    throw new Error("Cannot create error response for valid intent");
  }
  return NextResponse.json(
    { error: result.error, code: result.code },
    { status }
  );
}
