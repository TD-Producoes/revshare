/**
 * RevClaw Intent Enforcement Middleware
 *
 * Provides route-level enforcement for high-risk actions that require approved intents.
 *
 * Usage:
 * 1. Import `requireApprovedIntent` or `withIntentEnforcement`
 * 2. Call before executing the high-risk action
 * 3. On success, mark the intent as executed after the action completes
 */

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPayload } from "./crypto";
import {
  authenticateBot,
  verifyIntent,
  markIntentExecuted,
  createAuditLog,
  botAuthErrorResponse,
  intentErrorResponse,
  type BotAuthContext,
  type IntentKind,
  type IntentVerification,
} from "./intent-auth";

// =============================================================================
// Enforcement Types
// =============================================================================

export interface EnforcementContext {
  botAuth: BotAuthContext;
  intent: IntentVerification;
}

export type EnforcementResult =
  | { enforced: true; context: EnforcementContext }
  | { enforced: false; response: NextResponse };

// =============================================================================
// Core Enforcement Function
// =============================================================================

/**
 * Enforce that a bot request has an approved intent for a high-risk action.
 *
 * This function:
 * 1. Authenticates the bot
 * 2. Checks if the installation policy requires approval for this action
 * 3. If approval required, verifies the intent from X-RevClaw-Intent-Id header
 * 4. Returns the enforcement context or an error response
 *
 * Headers expected:
 *   - Authorization: Bearer <agent_secret>
 *   - X-RevClaw-User-Id: <user_id>
 *   - X-RevClaw-Intent-Id: <intent_id> (required if policy requires approval)
 *
 * @param request The incoming request
 * @param expectedKind The kind of intent expected (e.g., PROJECT_PUBLISH)
 * @param payload Optional payload to verify against the intent's payload hash
 */
export async function requireApprovedIntent(
  request: NextRequest | Request,
  expectedKind: IntentKind,
  payload?: unknown
): Promise<EnforcementResult> {
  // Step 1: Authenticate the bot
  const authResult = await authenticateBot(request);
  if (!authResult.success) {
    return { enforced: false, response: botAuthErrorResponse(authResult) };
  }

  const { context: botAuth } = authResult;

  // Step 2: Check if policy requires approval for this action
  const policyRequiresApproval = checkPolicyRequiresApproval(expectedKind, botAuth.installation);

  if (!policyRequiresApproval) {
    // Policy allows auto-approve; no intent needed
    // Create a synthetic "enforced" context without an actual intent
    return {
      enforced: true,
      context: {
        botAuth,
        intent: {
          intentId: `auto_${Date.now()}`,
          installationId: botAuth.installationId,
          agentId: botAuth.agentId,
          userId: botAuth.userId,
          kind: expectedKind,
          payloadHash: payload ? hashPayload(payload) : "",
          status: "APPROVED",
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          executedAt: null,
        },
      },
    };
  }

  // Step 3: Extract intent ID from header
  const intentId = request.headers.get("X-RevClaw-Intent-Id");
  if (!intentId) {
    return {
      enforced: false,
      response: NextResponse.json(
        {
          error: "Intent required for this action",
          code: "intent_required",
          message: `This action requires human approval. Create an intent via POST /api/revclaw/intents with kind="${expectedKind}" first.`,
        },
        { status: 403 }
      ),
    };
  }

  // Step 4: Verify the intent
  const intentResult = await verifyIntent(
    intentId,
    botAuth.installationId,
    expectedKind,
    payload
  );

  if (!intentResult.valid) {
    return { enforced: false, response: intentErrorResponse(intentResult) };
  }

  return {
    enforced: true,
    context: {
      botAuth,
      intent: intentResult.intent,
    },
  };
}

/**
 * Check if the installation policy requires approval for a given action kind.
 */
function checkPolicyRequiresApproval(
  kind: IntentKind,
  policy: {
    requireApprovalForPublish: boolean;
    requireApprovalForApply: boolean;
  }
): boolean {
  switch (kind) {
    case "PROJECT_PUBLISH":
      return policy.requireApprovalForPublish;
    case "APPLICATION_SUBMIT":
      return policy.requireApprovalForApply;
    default:
      return true; // Default to requiring approval for unknown kinds
  }
}

// =============================================================================
// Route Handler Wrapper
// =============================================================================

/**
 * Higher-order function to wrap a route handler with intent enforcement.
 *
 * Usage:
 * ```typescript
 * export const POST = withIntentEnforcement(
 *   "PROJECT_PUBLISH",
 *   async (request, context, { botAuth, intent }) => {
 *     // Your route logic here
 *     // intent is verified and can be marked as executed
 *     return NextResponse.json({ success: true });
 *   },
 *   (request, params) => extractPayloadForVerification(request, params)
 * );
 * ```
 */
export function withIntentEnforcement<TParams = unknown>(
  expectedKind: IntentKind,
  handler: (
    request: NextRequest,
    routeContext: { params: Promise<TParams> },
    enforcementContext: EnforcementContext
  ) => Promise<NextResponse>,
  payloadExtractor?: (
    request: NextRequest,
    routeContext: { params: Promise<TParams> }
  ) => Promise<unknown>
): (request: NextRequest, routeContext: { params: Promise<TParams> }) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext: { params: Promise<TParams> }) => {
    // Extract payload for verification if extractor provided
    let payload: unknown;
    if (payloadExtractor) {
      try {
        payload = await payloadExtractor(request, routeContext);
      } catch {
        return NextResponse.json(
          { error: "Failed to extract payload for intent verification", code: "payload_extraction_failed" },
          { status: 400 }
        );
      }
    }

    // Enforce the intent
    const result = await requireApprovedIntent(request, expectedKind, payload);
    if (!result.enforced) {
      return result.response;
    }

    const { context } = result;

    // Execute the handler
    let response: NextResponse;
    let success = false;
    let error: string | undefined;

    try {
      response = await handler(request, routeContext, context);
      success = response.ok || (response.status >= 200 && response.status < 300);
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      throw err;
    } finally {
      // Mark intent as executed (if it was a real intent, not auto-approved)
      if (context.intent.intentId && !context.intent.intentId.startsWith("auto_")) {
        await markIntentExecuted(context.intent.intentId, {
          success,
          error,
        });

        // Create audit log for the action execution
        await createAuditLog({
          agentId: context.botAuth.agentId,
          userId: context.botAuth.userId,
          action: `${expectedKind.toLowerCase()}.executed`,
          resourceType: "RevclawIntent",
          resourceId: context.intent.intentId,
          ipAddress:
            request.headers.get("x-forwarded-for") ??
            request.headers.get("x-real-ip") ??
            undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          payload: {
            kind: expectedKind,
            success,
            error: error ?? null,
          },
        });
      }
    }

    return response;
  };
}

// =============================================================================
// Utility: Check if request is from a bot
// =============================================================================

/**
 * Check if a request appears to be from a RevClaw bot (has Authorization header).
 * This is a lightweight check - full authentication happens in requireApprovedIntent.
 */
export function isBotRequest(request: NextRequest | Request): boolean {
  const authHeader = request.headers.get("Authorization");
  return authHeader?.startsWith("Bearer ") ?? false;
}

/**
 * Check if intent enforcement should be applied to this request.
 * Returns true if the request is from a bot AND the installation policy requires approval.
 *
 * This is useful for routes that serve both humans and bots.
 */
export async function shouldEnforceIntent(
  request: NextRequest | Request,
  kind: IntentKind
): Promise<{ shouldEnforce: boolean; botAuth?: BotAuthContext }> {
  if (!isBotRequest(request)) {
    return { shouldEnforce: false };
  }

  const authResult = await authenticateBot(request);
  if (!authResult.success) {
    // Auth failed, but we should still try to enforce (will return auth error)
    return { shouldEnforce: true };
  }

  const requiresApproval = checkPolicyRequiresApproval(kind, authResult.context.installation);
  return { shouldEnforce: requiresApproval, botAuth: authResult.context };
}
