import { EventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type RevclawEventParams = {
  type: EventType;
  agentId: string;
  /**
   * Optional because some RevClaw actions (e.g. agent registration) are not tied to a user yet.
   * When omitted, the Event will be stored as a system event (actorId = null).
   */
  userId?: string | null;
  projectId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  data?: Record<string, unknown> | null;
  /**
   * Whether this mutation was initiated by the agent (bot) or by the human user.
   * Used by the audit UI to render attribution like "via bot <name>".
   */
  initiatedBy?: "agent" | "user";
  installationId?: string | null;
  intentId?: string | null;
};

const DEFAULT_REDACTED = "[REDACTED]";

const SECRET_KEY_PATTERN =
  /(authorization|cookie|set-cookie|token|refresh_token|access_token|id_token|secret|password|passphrase|api[_-]?key|private[_-]?key)/i;

function redactStringValue(value: string): string {
  // Redact common bearer tokens without destroying the surrounding string.
  if (/^bearer\s+\S+/i.test(value)) {
    return "Bearer " + DEFAULT_REDACTED;
  }

  // Basic JWT-like / opaque token redaction when the value is clearly a token.
  if (value.length >= 24 && /[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value)) {
    return DEFAULT_REDACTED;
  }

  return value;
}

function redactUnknown(value: unknown, keyHint?: string): unknown {
  if (keyHint && SECRET_KEY_PATTERN.test(keyHint)) {
    return DEFAULT_REDACTED;
  }

  if (typeof value === "string") {
    return redactStringValue(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item));
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = redactUnknown(v, k);
    }
    return out;
  }

  return value;
}

export function redactEventData(data: Record<string, unknown> | null | undefined) {
  if (!data) return data;
  return redactUnknown(data) as Record<string, unknown>;
}

/**
 * Emit a stable, UI-friendly Event for RevClaw actions.
 *
 * - Never throws (best-effort).
 * - Redacts secrets from `data`.
 * - Stores a stable payload shape under `data.revclaw`.
 */
export async function emitRevclawEvent(params: RevclawEventParams): Promise<void> {
  try {
    const agent = await prisma.revclawAgent.findUnique({
      where: { id: params.agentId },
      select: { id: true, name: true },
    });

    const redacted = redactEventData(params.data ?? undefined) ?? undefined;

    const eventData: Record<string, unknown> = {
      ...(redacted ?? {}),
      revclaw: {
        agentId: params.agentId,
        agentName: agent?.name ?? undefined,
        installationId: params.installationId ?? undefined,
        intentId: params.intentId ?? undefined,
        initiatedBy: params.initiatedBy ?? "agent",
      },
    };

    await prisma.event.create({
      data: {
        type: params.type,
        actorId: params.userId ?? null,
        projectId: params.projectId ?? null,
        subjectType: params.subjectType ?? null,
        subjectId: params.subjectId ?? null,
        data: eventData as object,
      },
    });
  } catch (error) {
    // Best-effort: never break the primary mutation.
    console.warn("[RevClaw] Failed to emit audit Event", {
      type: params.type,
      agentId: params.agentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
