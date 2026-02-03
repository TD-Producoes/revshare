import { describe, it, expect, vi, beforeEach } from "vitest";

// IMPORTANT: mock prisma before importing the modules under test,
// because lib/prisma.ts requires DATABASE_URL at import time.
const prismaMock = {
  revclawAgent: {
    findUnique: vi.fn(),
  },
  event: {
    create: vi.fn(),
  },
  revclawRegistration: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  revclawInstallation: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  revclawExchangeCode: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/revclaw/tokens", () => ({
  generateExchangeCode: () => ({
    code: "exchange_code_plaintext",
    code_hash: "exchange_code_hash",
    expires_at: new Date("2026-02-03T00:00:00.000Z"),
  }),
}));

describe("RevClaw events helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.revclawAgent.findUnique.mockResolvedValue({ id: "agent_1", name: "My Bot" });
    prismaMock.event.create.mockResolvedValue({ id: "evt_1" });
  });

  it("redacts secrets from data and stores a stable revclaw payload", async () => {
    const { emitRevclawEvent } = await import("@/lib/revclaw/events");

    await emitRevclawEvent({
      type: "REVCLAW_TOKEN_REFRESHED",
      agentId: "agent_1",
      userId: "user_1",
      installationId: "inst_1",
      initiatedBy: "agent",
      data: {
        Authorization: "Bearer super-secret",
        refresh_token: "rt_123",
        nested: {
          token: "abc.def.ghi",
          ok: "keep",
        },
      },
    });

    expect(prismaMock.event.create).toHaveBeenCalledTimes(1);
    const callArg = prismaMock.event.create.mock.calls[0]?.[0];

    expect(callArg.data.type).toBe("REVCLAW_TOKEN_REFRESHED");
    expect(callArg.data.actorId).toBe("user_1");

    const stored = callArg.data.data;
    expect(stored.revclaw).toMatchObject({
      agentId: "agent_1",
      agentName: "My Bot",
      installationId: "inst_1",
      initiatedBy: "agent",
    });

    expect(stored.Authorization).toBe("[REDACTED]");
    expect(stored.refresh_token).toBe("[REDACTED]");
    expect(stored.nested.token).toBe("[REDACTED]");
    expect(stored.nested.ok).toBe("keep");
  });
});

describe("RevClaw route integration (minimal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.revclawAgent.findUnique.mockResolvedValue({ id: "agent_1", name: "My Bot" });
    prismaMock.event.create.mockResolvedValue({ id: "evt_1" });

    prismaMock.revclawRegistration.findUnique.mockResolvedValue({
      id: "reg_1",
      agentId: "agent_1",
      claimId: "claim_1",
      requestedScopes: ["scope:a"],
      status: "PENDING",
      expiresAt: new Date("2026-02-04T00:00:00.000Z"),
      agent: {
        id: "agent_1",
        name: "My Bot",
        status: "ACTIVE",
      },
    });

    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1" });
    prismaMock.revclawInstallation.findUnique.mockResolvedValue({
      id: "inst_1",
      agentId: "agent_1",
      userId: "user_1",
      status: "ACTIVE",
    });

    prismaMock.revclawRegistration.update.mockResolvedValue({ id: "reg_1" });
    prismaMock.revclawExchangeCode.create.mockResolvedValue({ id: "ex_1" });
  });

  it("processClaimInternal emits an Event row (without leaking exchange_code)", async () => {
    const { processClaimInternal } = await import(
      "@/app/api/revclaw/agents/claim/route"
    );

    const result = await processClaimInternal({
      agentId: "agent_1",
      claimId: "claim_1",
      telegramUserId: "1234",
    });

    expect(result.success).toBe(true);
    expect(prismaMock.event.create).toHaveBeenCalledTimes(1);

    const callArg = prismaMock.event.create.mock.calls[0]?.[0];
    expect(callArg.data.type).toBe("REVCLAW_AGENT_CLAIMED");
    expect(callArg.data.actorId).toBe("user_1");

    const stored = callArg.data.data;
    expect(stored.revclaw).toMatchObject({
      agentId: "agent_1",
      agentName: "My Bot",
      installationId: "inst_1",
    });

    // Should never store secrets like the plaintext exchange code.
    expect(JSON.stringify(stored)).not.toContain("exchange_code_plaintext");
  });
});
