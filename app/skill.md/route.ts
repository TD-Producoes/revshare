import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Keep this public doc cacheable. It changes rarely, but we may tweak copy.
export const revalidate = 3600;

const CANONICAL_ORIGIN = "https://revshare.fast";

function buildMarkdown(): string {
  const appVersion = process.env.npm_package_version ?? "0.0.0";
  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "";

  const frontmatterLines = [
    "---",
    "name: revclaw",
    `version: ${appVersion}`,
    "description: RevClaw agent integration for RevShare. Allows OpenClaw/Clawdbot to publish projects and submit applications on behalf of users.",
    `homepage: ${CANONICAL_ORIGIN}`,
    `metadata: {\"revclaw\":{\"api_base\":\"${CANONICAL_ORIGIN}/api\",\"registration_endpoint\":\"${CANONICAL_ORIGIN}/api/revclaw/agents/register\",\"auth_instructions_url\":\"${CANONICAL_ORIGIN}/revclaw/auth.md\",\"auth_scheme\":\"bearer-access-token\"}}`,
    "---",
  ];

  if (gitSha) frontmatterLines.push(`commit_sha: ${gitSha}`);
  frontmatterLines.push("---");

  const bodyLines = [
    "",
    "# RevClaw",
    "",
    "RevClaw is RevShare’s bot integration surface for OpenClaw/Clawdbot agents. It lets an agent act **on behalf of a human** (never as the principal) to publish projects and submit applications — with approval required by default for high‑risk actions.",
    "",
    "## Skill Files",
    "",
    "| File | URL |",
    "|------|-----|",
    `| **SKILL.md** (this file) | \`${CANONICAL_ORIGIN}/skill.md\` |`,
    `| **AUTH.md** | \`${CANONICAL_ORIGIN}/revclaw/auth.md\` |`,
    "",
    "**Install locally (optional):**",
    "```bash",
    "mkdir -p ~/.openclaw/skills/revclaw",
    `curl -s ${CANONICAL_ORIGIN}/skill.md > ~/.openclaw/skills/revclaw/SKILL.md`,
    `curl -s ${CANONICAL_ORIGIN}/revclaw/auth.md > ~/.openclaw/skills/revclaw/AUTH.md`,
    "```",
    "",
    "**Base URL:** `https://revshare.fast/api`",
    "",
    "⚠️ IMPORTANT:",
    "- This file is public and contains **no secrets**.",
    "- **Never** put identity proofs, exchange codes, access tokens, or refresh tokens in URLs.",
    "",
    "## API base",
    "",
    `- Base URL: \`${CANONICAL_ORIGIN}/api\``,
    "- Registration: `POST /api/revclaw/agents/register`",
    `- Auth instructions: \`${CANONICAL_ORIGIN}/revclaw/auth.md\``,
    "",
    "## Authentication (summary)",
    "",
    "After registration + human claim/approval, the bot obtains an **access token** and calls API endpoints with:",
    "",
    "`Authorization: Bearer <access_token>`",
    "",
    "Tokens are **short-lived** (<= 15 minutes) and scoped.",
    "",
    "## Tools / actions (v0)",
    "",
    "> Names below are descriptive. Exact REST endpoints are provided.",
    "",
    "### Minimal end-to-end flow (v0)",
    "1. `POST /api/revclaw/agents/register` → receive `{ agent_id, agent_secret, claim_id, expires_at }`.",
    "2. Ask the human to approve the claim in Telegram (server-side inline button callback).",
    "3. Poll `GET /api/revclaw/agents/:agent_id/claim-status` until it returns `status=claimed` + `exchange_code`.",
    "4. `POST /api/revclaw/tokens` with `{ agent_id, agent_secret, exchange_code }` → receive `{ access_token, refresh_token }`.",
    "5. Call APIs with `Authorization: Bearer <access_token>`.",
    "6. For publish/apply: create an intent → human approves → execute once with intent enforcement.",
    "",    
    "",
    "### Identity + install",
    "- **verify_identity** → `POST /api/revclaw/agents/verify-identity`",
    "- **register_agent** → `POST /api/revclaw/agents/register`",
    "- **claim_status** (bot polling) → `GET /api/revclaw/agents/:agent_id/claim-status`",
    "- **token_exchange** → `POST /api/revclaw/tokens`",
    "- **token_refresh** → `POST /api/revclaw/tokens/refresh`",
    "- **revoke_installation** (human) → `POST /api/revclaw/installations/:id/revoke`",
    "",
    "### Projects",
    "- **list_projects** (read) → `GET /api/projects`",
    "- **get_project** (read) → `GET /api/projects/:id`",
    "- **create_project_draft** → `POST /api/projects`",
    "- **update_project_draft** → `PATCH /api/projects/:id`",
    "- **publish_project** (approval required by default) → via **intent** (see below)",
    "",
    "### Applications",
    "- **list_applications** (read) → `GET /api/applications`",
    "- **create_application_draft** → `POST /api/applications`",
    "- **update_application_draft** → `PATCH /api/applications/:id`",
    "- **submit_application** (approval required by default) → via **intent**",
    "",
    "### Stripe Connect",
    "- **create_stripe_connect_link** → `POST /api/projects/:id/stripe/connect-link`",
    "",
    "### Approval / intents (high-risk actions)",
    "- **create_intent** → `POST /api/revclaw/intents`",
    "- **approve_intent** (human) → `POST /api/revclaw/intents/:id/approve`",
    "- **deny_intent** (human) → `POST /api/revclaw/intents/:id/deny`",
    "",
    "High-risk actions (publish/apply) MUST be performed through an approved intent by default.",
    "",
    "## Scopes (v0)",
    "",
    "- `revclaw:install` — register + establish an installation",
    "- `projects:read`",
    "- `projects:draft_write`",
    "- `projects:publish` *(approval required by default)*",
    "- `applications:read`",
    "- `applications:draft_write`",
    "- `applications:submit` *(approval required by default)*",
    "- `stripe:connect_link`",
    "",
    "## Security notes (non-negotiable)",
    "",
    "- **No secrets in URLs.** Never pass access/refresh tokens, exchange codes, or identity proofs in query strings.",
    "- **No secrets in this document.** This file is public.",
    "- All writes MUST be attributable to the human user and (if applicable) the agent.",
    "",
  ];

  return [...frontmatterLines, ...bodyLines].join("\n");
}

export async function GET() {
  const body = buildMarkdown();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Public, cacheable doc; safe to cache at CDN.
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
