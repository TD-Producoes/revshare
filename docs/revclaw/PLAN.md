# RevClaw Implementation Plan (draft)

This plan follows `docs/revclaw/REQUIREMENTS.md`.

## Phase 0 — Foundations (no user-facing changes required)
1) Data model + migrations
   - RevclawAgent, RevclawRegistration, RevclawInstallation, RevclawIntent, AuditLog (hash-chained)
   - Add Telegram anchor fields/mapping to User (or join table) + pending_email flow support.
2) Shared security primitives
   - SSRF-safe fetch + allowlist URL validation for manifest ingestion
   - Idempotency key helper + storage
   - Auth header redaction in logs (if not already)
3) Policy enforcement skeleton
   - Decide enforcement location (middleware vs per-route)
   - Introduce a single "RevClaw auth" verifier used by all new endpoints

## Phase 1 — Install & Founder Flow (minimal slice)
1) Public bot entrypoints
   - `GET /skill.md` (canonical)
   - `GET /revclaw/auth.md`
2) Register + claim
   - `POST /api/revclaw/agents/register` -> {agent_id, agent_secret, claim_id, expires_at}
   - Telegram inline claim flow -> `POST /api/revclaw/agents/claim`
   - `GET /api/revclaw/agents/:agent_id/claim-status` (bot-auth)
3) Tokens
   - `POST /api/revclaw/tokens` (exchange -> access/refresh)
   - `POST /api/revclaw/tokens/refresh` (rotation)
   - `POST /api/revclaw/installations/:id/revoke` (human)
4) Project draft + publish via intents
   - `POST /api/revclaw/intents` (publish)
   - Telegram approve/deny callbacks for intent
   - Execution path calls existing project publish handler (or a new safe wrapper)

## Phase 2 — Marketer Flow
- Same intent pattern for applications submit.

## Phase 3 — Reduce polling
- Webhooks/SSE for claim status + intent updates.

## Key decisions to make early
- Token format: opaque vs JWT
- Where to enforce policy: middleware vs per-route
- Bot identity proof availability (OpenClaw identity token?)

## Engineering workflow (autonomous)
- Use `git worktree` per feature slice.
- Each slice ships behind minimal, testable acceptance criteria.
- PRs: small, reviewable; template fully filled; includes screenshots for UI changes.
