import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const CANONICAL_ORIGIN = "https://revshare.fast";

function buildAuthMarkdown(): string {
  const appVersion = process.env.npm_package_version ?? "0.0.0";
  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "";

  const frontmatterLines = [
    "---",
    "name: revclaw-auth",
    `version: ${appVersion}`,
    "description: Authentication flow for RevClaw agents (Telegram-first identity, minimal friction).",
    `homepage: ${CANONICAL_ORIGIN}`,
    `metadata: {\"revclaw\":{\"api_base\":\"${CANONICAL_ORIGIN}/api\",\"registration_endpoint\":\"${CANONICAL_ORIGIN}/api/revclaw/agents/register\",\"claim_flow\":\"telegram-inline-button-callback\",\"identity_verification_endpoint\":\"${CANONICAL_ORIGIN}/api/revclaw/agents/verify-identity\",\"claim_status_endpoint\":\"${CANONICAL_ORIGIN}/api/revclaw/agents/:agent_id/claim-status\",\"token_exchange_endpoint\":\"${CANONICAL_ORIGIN}/api/revclaw/tokens\",\"token_refresh_endpoint\":\"${CANONICAL_ORIGIN}/api/revclaw/tokens/refresh\",\"auth_scheme\":\"bearer-access-token\"}}`,
    "---",
  ];

  if (gitSha) frontmatterLines.splice(-1, 0, `commit_sha: ${gitSha}`);

  const bodyLines = [
    "",
    "# RevClaw Auth (v0)",
    "",
    "This document explains how a RevClaw-capable agent authenticates to RevShare.",
    "",
    "**Important:**",
    "- This page is public and contains **no secrets**.",
    "- Do **not** put identity proofs, exchange codes, access tokens, or refresh tokens in URLs.",
    "",
    "## Overview (requirements §§10.1–10.4)",
    "",
    "1. *(Optional)* Bot proves its identity to RevShare (server-to-server) → **identity verification**.",
    "2. Bot registers itself → receives an `agent_id`, an `agent_secret` (bot-only), and a `claim_id`.",
    "3. A human claims/approves the registration **inside Telegram** (inline button callback).",
    "4. Bot polls claim status until it is claimed; once claimed it receives an **exchange_code**.",
    "5. Bot exchanges the exchange code for a short-lived **access token** (and optionally a rotating refresh token).",
    "",
    "## Endpoints",
    "",
    "### 1) Identity verification (optional but recommended)",
    "`POST /api/revclaw/agents/verify-identity`",
    "",
    "- Input: a short-lived identity proof (implementation-defined)",
    "- Output: verified bot identity + metadata",
    "",
    "Identity proofs:",
    "- identify the bot",
    "- **do not** grant API access",
    "",
    "### 2) Register an agent",
    "`POST /api/revclaw/agents/register`",
    "",
    "Returns (example shape):",
    "`{ agent_id, agent_secret, claim_id, expires_at }`",
    "",
    "Notes:",
    "- `agent_secret` is a **bot-only** secret.",
    "- `claim_id` is single-use, short-lived, and not guessable.",
    "",
    "### 3) Human claim / approval via Telegram",
    "Claim is initiated via a **Telegram inline button callback**.",
    "",
    "- Humans never copy/paste secrets.",
    "- RevShare derives `telegram_user_id` from the Telegram-authenticated callback context (never from bot-provided JSON).",
    "",
    "(For implementers: see requirements §10.2 “Agent register + claim”.)",
    "",
    "### 4) Bot polling: claim status",
    "`GET /api/revclaw/agents/:agent_id/claim-status`",
    "",
    "- MUST require bot authentication (e.g. `agent_secret` and/or identity proof)",
    "- MUST NOT include access/refresh tokens",
    "- After claim, MAY return an `exchange_code` only to the authenticated bot",
    "",
    "### 5) Token exchange",
    "`POST /api/revclaw/tokens`",
    "",
    "Exchanges a bot-only `exchange_code` for:",
    "- a short-lived **access token** (<= 15 minutes)",
    "- optional rotating **refresh token**",
    "",
    "### 6) Refresh",
    "`POST /api/revclaw/tokens/refresh`",
    "",
    "Refresh tokens (if used) MUST be rotating (reuse invalidates the chain).",
    "",
    "## Using the access token",
    "",
    "Include the access token on API calls:",
    "",
    "`Authorization: Bearer <access_token>`",
    "",
    "Tokens are bound to the installation + granted scopes snapshot.",
    "",
    "## Security + logging requirements (selected)",
    "",
    "- Access tokens short-lived (<= 15m)",
    "- Refresh tokens rotate; reuse invalidates",
    "- Revocation is immediate (server-side enforcement)",
    "- Logs MUST redact auth headers",
    "",
  ];

  return [...frontmatterLines, ...bodyLines].join("\n");
}

export async function GET() {
  const body = buildAuthMarkdown();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
