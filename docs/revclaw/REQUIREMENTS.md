# RevClaw — Engineering Requirements (Internal)

> Purpose: **engineering spec** for building RevClaw inside RevShare.
> Audience: maintainers + contributors.
> Non-goal: marketing copy.

## 0) TL;DR
RevClaw lets an OpenClaw/Clawdbot agent act **on behalf of a human RevShare user** to:
- publish/manage projects (founder flow)
- apply to projects as a marketer (marketer flow)

**Moltbook-inspired model (adapted)**:
- `/skills.md` is public **instructions + declaration** (no secrets)
- the bot authenticates to RevShare using a bot-held credential and/or an identity proof (RevClaw verification endpoint)
- **nothing needs to be shared with the human** for the bot to operate
- optional: RevShare asks the human to approve installs and/or high-risk actions

Key constraint: **Security first**.
- The bot is never a principal owner.
- All actions are attributed to the human.
- High-risk actions require explicit human approval by default.

---

## 1) Definitions
- **Human**: a RevShare `User` (founder and/or marketer).
- **Agent/Bot**: an automated client (OpenClaw/Clawdbot) requesting delegated access.
- **Installation**: bot ↔ human binding with granted scopes + policy.
- **Intent**: a proposed action created by the bot that may require approval.

---

## 2) Goals
### 2.1 Product goals
1) **Minimal friction** delegation:
   - bot starts from a public `/skills.md`
   - human approves in 1–2 taps
2) **Human-first attribution**:
   - bot executes *on behalf of* the human
   - audit trail is clear and queryable
3) **Secure-by-default policies**:
   - scoping, revocation, rate limits
   - confirmation for publish/apply by default
4) **Stripe transparency remains central**:
   - project creation does not require Stripe
   - revenue tracking requires Stripe Connect; can be connected later

### 2.2 Engineering goals
- Small v0 that can ship incrementally.
- Backwards compatible with current RevShare APIs where possible.
- All risky surfaces guarded (no secrets in docs, no tokens in URLs, no over-broad scopes).

---

## 3) Non-goals (v0)
- Bot marketplace / social layer.
- Fully autonomous “no-approval ever” mode.
- Bot-managed Stripe credentials.
- General OAuth provider for arbitrary third-party apps beyond RevClaw.
- Bot-triggered payouts/financial operations (v0 should **disallow** payouts entirely).

---

## 4) Threat model (MUST consider)
- **Malicious bot** trying to gain scopes, bypass approval, or act as another user.
- **Compromised bot token** (leaked from logs, device compromise).
- **Approval phishing / session confusion** (user approves wrong bot/payload).
- **SSRF** via manifest/skills URL ingestion.
- **Replay** of registration codes, approval links, or intents.

---

## 5) Security invariants (MUST)
1) **/skills.md is a declaration, not authorization**.
   - MUST contain zero secrets.
2) **No bot can own funds or Stripe accounts**.
   - Stripe Connect OAuth MUST be completed by human in a browser session.
3) **No secrets in URLs**.
   - No access/refresh tokens, codes, or secrets in query strings.
4) **Every write is attributable**.
   - record both bot+human attribution on each mutation.
5) **Approval is optional, but enforced for high-risk by default**.
   - publishing projects and applying as marketer MUST require explicit approval by default
   - the human can later relax policy via installation settings (with strong warnings)
6) **Revocation is immediate**.
   - revoking an installation MUST invalidate all tokens immediately (server-side check).
7) **Idempotency**.
   - all mutating operations must support idempotency keys.
8) **Least privilege scopes**.
   - minimum scope set for v0; scope escalation requires explicit approval.
9) **Audit trail is tamper-evident**.
   - define a concrete mechanism (hash-chaining at minimum).

---

## 6) Primary user stories
### 6.1 Identity + account creation (Telegram-first, Moltbook-inspired)
Goal: allow a bot to operate end-to-end without sharing credentials with the human, while preserving a secure path for the human to later log in with email.

**Key principle:** Telegram is the initial human identity anchor; email is optional and only becomes a login identity after verification.

1) Bot requests installation/registration
   - bot provides its manifest and a bot identity proof (see §10.1)
2) Human approves bot installation (1–2 taps) in Telegram
   - server MUST derive `telegram_user_id` from a Telegram-authenticated context (button callback / signed Telegram data), never from bot-supplied JSON
3) Server binds or creates a RevShare user:
   - If a user already exists for `telegram_user_id`, reuse it
   - Else create a **provisional user** anchored to `telegram_user_id` (no password required)
4) Bot asks the human to confirm which email should be attached for future login/notifications
   - this step MUST be explicit confirmation by the human (Telegram approve/deny), to prevent account-takeover via email attachment
5) Server stores the email as **pending/unverified** (NOT a login identity yet)
6) When the human wants to log in later (use existing RevShare signup/login):
   - user signs up with the same email and completes the existing email confirmation
   - after email verification, server **claims/merges** the Telegram-anchored provisional account if `pending_email == verified_email`
   - (optional) user sets password after verification

Conflict rule:
- if the verified email already belongs to a different existing user, do **not** auto-merge; require a manual resolution path

Rules:
- Bot MUST NOT set or know a user password.
- Email MUST NOT become a login identity until verified via magic link.
- Changing `pending_email` MUST require explicit human confirmation.
- All bot tokens remain bound to installation + telegram-anchored user.

### 6.2 Founder story: bot publishes a project
1) Bot is installed for a human user (see 6.1)
2) Bot creates project (draft) + asks human for missing fields
3) Bot proposes publish intent
4) Human approves publish
5) Bot publishes project
6) Human connects Stripe later via one-tap link generated by RevShare

### 6.3 Marketer story: bot applies to a project
1) Bot is installed for a human user (see 6.1)
2) Bot discovers suitable projects (read-only)
3) Bot prepares application draft
4) Bot proposes apply intent
5) Human approves apply
6) Application is submitted as the human marketer

---

## 7) UX requirements (internal)
### 7.1 Approval UX (Moltbook-like)
Approval is how the human stays in control. It should be **optional** globally, but **required by default** for high-risk actions.

- Approval should be achievable via:
  - **Telegram inline buttons** (recommended for Telegram-first identity)
  - RevShare web approval page (optional / phase 2)

Telegram approval requirements:
- Approval MUST be bound to the Telegram sender (`telegram_user_id`) derived from Telegram update/callback (never bot-provided).
- The UI text MUST show “Approving as @handle / telegram_user_id …” to prevent confusion.

Approval screen MUST display:
- bot identity (name + fingerprint)
- requested scopes and granted scopes
- for intents: a **clear payload summary** + risk label
- “you are approving as …” to prevent session confusion

### 7.2 Guardrails UX
When approving a bot, allow the human to set:
- granted scopes
- confirmation toggles (publish/apply)
- optional limits (per-day apply count, allowed categories, etc.)

---

## 8) Bot surface (/skills.md + auth instructions)
### 8.1 Locations
- `GET /skills.md` — public skill/instructions for bots (canonical).
- `GET /revclaw/auth.md` — dynamic auth instructions (similar to Moltbook’s hosted instructions).

Domain requirement:
- canonical public domain for RevClaw skill docs is **https://revshare.fast**
  - use `https://revshare.fast/skills.md`


### 8.2 Content requirements
- human-readable + machine-parseable frontmatter
- API base URL
- registration endpoint
- list of tools/actions
- auth scheme
- scope list + which actions require approval
- version

**No secrets. No tokens.**

### 8.3 Manifest ingestion safety
If registration accepts a `manifest_url`:
- MUST block private IP ranges + link-local + metadata endpoints
- MUST enforce strict timeouts + max size + content-type validation
- MUST store an immutable **snapshot** (raw markdown) at approval time
- MUST treat markdown as untrusted: sanitize before rendering in UI

---

## 9) Scope taxonomy (v0)
Define minimal scopes and map them to endpoints.

Recommended v0 scopes:
- `revclaw:install` (registration -> installation)
- `projects:read`
- `projects:draft_write`
- `projects:publish` (MUST require approved intent)
- `applications:read`
- `applications:draft_write`
- `applications:submit` (MUST require approved intent)
- `stripe:connect_link` (create connect link)

Payout/financial scopes: **not in v0**.

---

## 10) API requirements (v0)
### 10.1 Moltbook-style identity verification (recommended)
RevClaw SHOULD support a Moltbook-like pattern where the bot can present an **identity proof** that RevShare can verify server-to-server.

Important: this is **bot ↔ RevShare** only — the human does not need to receive or handle any tokens/codes.

- `POST /api/revclaw/agents/verify-identity`
  - input: identity proof (e.g., identity token)
  - output: verified bot identity + metadata

Requirements:
- Identity proofs are short-lived.
- Identity proofs MUST NOT grant API access; they only identify the bot.
- Never put identity proofs in URLs.

> If OpenClaw cannot provide identity proofs yet, v0 can treat identity as “unverified” but MUST show a warning and require explicit approval.

### 10.2 Agent register + claim (Moltbook-style)
RevClaw uses a **claim flow** similar to Moltbook: the bot can self-register, but must be **claimed** by a human before it can act on behalf of that human.

- `POST /api/revclaw/agents/register`
  - input: bot metadata + manifest (markdown or url) + optional identity proof
  - output: `{ agent_id, agent_secret, claim_id, expires_at }`

Requirements:
- `agent_secret` is a bot-only secret used to authenticate bot polling and token minting.
  - MUST never be shown to the human.
  - MUST be stored securely by the bot.
  - SHOULD be stored hashed/encrypted at rest server-side.

Claim requirements (NO secrets in URLs):
- `claim_id` MUST be single-use, short-lived, and not guessable.
- Claim MUST be initiated via **Telegram inline button callback** (no copy/paste, no “token in a URL”).
- Claim endpoint MUST bind to `telegram_user_id` derived from Telegram callback context.

- `POST /api/revclaw/agents/claim`
  - human-authenticated via Telegram callback (server derives `telegram_user_id`)
  - input: `claim_id` + requested scopes/policy
  - output: `{ installation_id }`

### 10.3 Claim status + exchange (bot polling)
- `GET /api/revclaw/agents/:agent_id/claim-status`
  - MUST require bot authentication (e.g., `agent_secret` and/or §10.1 identity proof)
  - returns: `{ status: pending|claimed|expired|revoked }`
  - MUST NOT include access/refresh tokens
  - MAY return an `exchange_code` **only** to the authenticated bot after status becomes `claimed`

### 10.4 Token lifecycle (MUST be explicit)
**Design goal:** the bot is fully autonomous; no human copy/paste of secrets.

- Access tokens MUST be **short-lived** (<= 15 minutes).
- Refresh tokens (if used) MUST be **rotating** (reuse invalidates chain).
- Tokens MUST be bound to `installation_id` + scopes snapshot.
- Tokens MUST be stored hashed/encrypted at rest; logs MUST redact auth headers.
- Revocation MUST be immediate via server-side introspection/DB lookup.

Artifact classification:
- **Identity proof** (see §10.1): identifies bot; not an API credential.
- **Exchange code**: server-issued, single-use secret used only for token minting.
- **Access token**: bearer token for API calls.
- **Refresh token**: rotating secret.

Delivery requirements (no sharing):
- Exchange codes and tokens MUST never be displayed to the human.
- Bot retrieves an exchange code only via bot-authenticated polling:
  - bot polls `GET /api/revclaw/agents/:agent_id/claim-status` until it returns `status=claimed` plus `exchange_code`
  - then calls `POST /api/revclaw/tokens` to mint access/refresh tokens

Endpoints:
- `POST /api/revclaw/tokens` (exchange -> access/refresh)
- `POST /api/revclaw/tokens/refresh` (rotate refresh -> new access/refresh)
- `POST /api/revclaw/installations/:id/revoke` (human)

### 10.5 Action intents (integrity MUST)
- `POST /api/revclaw/intents`
  - bot-authenticated
  - input: `{ kind, payload_json, idempotency_key }`
  - server MUST compute `payload_hash` and store immutable snapshot.
  - output: status + approval_url if needed.

- `POST /api/revclaw/intents/:id/approve` (human)
  - MUST approve a specific `payload_hash`.

- `POST /api/revclaw/intents/:id/deny` (human)

Rules:
- Intent payload MUST be immutable after creation.
- Approved intent executes at most once (idempotent).
- If an intent changes, bot must create a new intent.

### 10.6 Policy enforcement location (NO bypass)
**MUST** enforce policy on every request authenticated with a bot token.
Either:
- central middleware/gateway that runs before all domain handlers, OR
- domain endpoints individually enforce: scope + intent-required + on-behalf-of checks.

**Existing domain endpoints MUST NOT accept bot tokens unless they enforce the RevClaw policy.**

---

## 11) Approval link security (MUST)
- Approval URLs MUST be:
  - short-lived (minutes)
  - single-use
  - not guessable
  - bound to the correct user session + installation/registration/intent
- Approval endpoints MUST be CSRF-protected.
- Approval pages MUST be clickjacking-protected (`frame-ancestors 'none'`).
- Set `Referrer-Policy: no-referrer` on approval pages.

---

## 12) Stripe Connect requirements (late connection)
### 12.1 Principles
- Project creation does not require Stripe.
- Revenue transparency requires Stripe Connect OAuth.

### 12.2 Flow
1) Bot triggers server to create a connect session:
   - `POST /api/projects/:id/stripe/connect-link`
2) Server returns a short-lived URL (no secrets in URL parameters beyond a signed, expiring state).
3) Human completes OAuth in browser.
4) Callback stores connected account id on project/user.
5) Bot continues once `stripe_status=connected`.

---

## 13) Data model requirements (v0)
### 13.1 Entities
- `RevclawAgent` (bot identity + manifest snapshot hash)
- `RevclawRegistration` (pending approval; expires)
- `RevclawInstallation` (agent ↔ user binding + granted scopes + policy)
- `RevclawIntent` (immutable payload snapshot + hash)
- `AuditLog` (append-only, tamper-evident)

### 13.2 Telegram-first account anchoring
RevClaw requires a stable human anchor even before email verification.

Requirements:
- Store `telegram_user_id` on the RevShare user record (or equivalent mapping table).
- Allow creating a **provisional user** with:
  - `telegram_user_id` set
  - `email` empty or present but **unverified/pending**
  - no password set by the bot

Email attachment requirements:
- support `pending_email` + `email_verified=false` state
- only promote to `email`/login identity after magic-link verification

### 13.3 Attribution fields
For any mutable domain action initiated by bot:
- `performed_by_agent_id` (nullable)
- `on_behalf_of_user_id` (required if performed_by_agent_id set)

---

## 14) Rate limits & abuse controls (MUST)
- Per-installation and per-user rate limits (burst + sustained).
- Lock/slowdown after repeated denied approvals.
- Limits configurable via installation policy (optional v0).

---

## 15) Audit requirements (MUST be concrete)
- Every mutation must emit an audit record with:
  - timestamp
  - human user id
  - agent id (if any)
  - resource type/id
  - action
  - request id / idempotency key
- Tamper-evident mechanism (minimum): hash chain of audit entries.
- Audit logs must not include secrets.

---

## 16) Rollout plan
### Phase 0
- Spec + data model + endpoints stubs.

### Phase 1 (founder flow)
- registration + approve
- create draft projects
- publish via intent approval

### Phase 2 (marketer flow)
- apply via intent approval

### Phase 3 (events)
- SSE/webhooks so bot doesn’t poll.

---

## 17) Acceptance criteria (v0) (MUST be testable)
### 17.1 Telegram-first identity + email later
- On first bot install approval, the system binds to an existing user by `telegram_user_id` or creates a provisional user.
- Bot can create drafts/actions for the provisional user without requiring email verification.
- Email provided by the human is stored as pending/unverified and is not usable for login until verified.
- When the user wants login later, they can use the existing signup flow with the same email; after email verification, the server links/claims the Telegram-anchored account if `pending_email == verified_email`.
- Bot never sets or knows any user password.

### 17.2 Token + revocation
- Access tokens expire (<= 15m).
- Revoking installation invalidates access immediately.
- Refresh tokens rotate; reuse invalidates chain.
- Tokens never appear in URLs; logs redact auth headers.

### 17.3 Manifest ingestion
- Registration rejects manifest URLs resolving to private IP ranges.
- Server stores immutable manifest snapshot; approval UI shows snapshot + requested scopes.

### 17.4 Intent enforcement
- Calling publish/apply without an approved intent returns deterministic error (e.g., 403 `intent_required`).
- Approved intent executes exactly once; duplicates do not create duplicates.
- Intent payload immutable after creation; approval references `payload_hash`.

### 17.5 Approval UX security
- Approve/deny endpoints CSRF-protected.
- Approval page clickjacking-protected.
- Approval screen shows bot identity + scopes + clear payload summary.

### 17.6 Authorization correctness
- Bot cannot act across users/installations even with a valid token.
- Scope checks enforced on every request; negative tests prove least privilege.

### 17.7 Audit
- Every mutation includes bot+human attribution and is queryable.
- Audit log is tamper-evident (hash-chained) and excludes secrets.

---

## 18) Open questions
1) Can OpenClaw provide a Moltbook-like **identity token** for verification? If not, what is the v0 identity proof?
2) Approval channel priority: web-only vs web+Telegram.
3) Token format: opaque tokens vs JWT + rotation.
4) Where to enforce policy: middleware vs per-route.
5) Minimal v0 scopes exact mapping.
