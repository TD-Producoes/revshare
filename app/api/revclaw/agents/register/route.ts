import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { fetchManifestMarkdown, MAX_MANIFEST_BYTES } from "@/lib/revclaw/manifest";
import { generateOpaqueToken, hashAgentSecret, sha256Hex } from "@/lib/revclaw/secret";

const inputSchema = z
  .object({
    name: z.string().min(1).max(80),
    description: z.string().min(1).max(500).optional(),

    // Exactly one of these must be provided.
    manifest_markdown: z.string().min(1).max(MAX_MANIFEST_BYTES).optional(),
    manifest_url: z.string().min(1).max(2048).optional(),

    identity_proof_url: z.string().url().max(2048).optional(),

    // Optional scopes requested by the agent (Phase 1 keeps as opaque strings)
    requested_scopes: z.array(z.string().min(1).max(80)).max(50).optional(),

    // Optional extra metadata (stored as JSON)
    metadata: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      const hasMarkdown = !!data.manifest_markdown;
      const hasUrl = !!data.manifest_url;
      return hasMarkdown !== hasUrl;
    },
    {
      message: "Provide exactly one of manifest_markdown or manifest_url",
      path: ["manifest_markdown"],
    },
  );

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    name,
    description,
    manifest_markdown,
    manifest_url,
    identity_proof_url,
    requested_scopes,
    metadata,
  } = parsed.data;

  let manifestSnapshot: string;
  let manifestUrlToStore: string | null = null;

  try {
    if (manifest_url) {
      const fetched = await fetchManifestMarkdown(manifest_url);
      manifestSnapshot = fetched.markdown;
      manifestUrlToStore = fetched.manifestUrl;
    } else {
      manifestSnapshot = (manifest_markdown ?? "").trim();
    }

    if (!manifestSnapshot) {
      return NextResponse.json({ error: "manifest is empty" }, { status: 400 });
    }

    if (Buffer.byteLength(manifestSnapshot, "utf8") > MAX_MANIFEST_BYTES) {
      return NextResponse.json(
        { error: "manifest too large (max 64KB)" },
        { status: 400 },
      );
    }

    const agentSecret = generateOpaqueToken(32);
    const claimId = generateOpaqueToken(32);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const manifestSnapshotHash = sha256Hex(manifestSnapshot);
    const agentSecretHash = hashAgentSecret(agentSecret);

    const agent = await prisma.revclawAgent.create({
      data: {
        name: name.trim(),
        manifestUrl: manifestUrlToStore,
        manifestSnapshot,
        manifestSnapshotHash,
        agentSecretHash,
        identityProofUrl: identity_proof_url ?? null,
        metadata: {
          ...(description ? { description: description.trim() } : {}),
          ...(metadata ?? {}),
        },
      },
      select: { id: true },
    });

    await prisma.revclawRegistration.create({
      data: {
        agentId: agent.id,
        claimId,
        requestedScopes: requested_scopes ?? [],
        expiresAt,
        status: "PENDING",
      },
      select: { id: true },
    });

    // Important: agent_secret is ONLY returned here and never again.
    return NextResponse.json(
      {
        agent_id: agent.id,
        agent_secret: agentSecret,
        claim_id: claimId,
        expires_at: expiresAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Treat fetch/validation issues as 400; DB failures as 500.
    const status =
      message.includes("manifest") ||
      message.includes("content") ||
      message.includes("resolves") ||
      message.includes("redirect") ||
      message.includes("Invalid")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
