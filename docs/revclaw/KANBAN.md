# RevClaw Kanban

> Source of truth for RevClaw build status (until we move to GitHub Projects/Notion).

## Backlog
- Implement canonical `/skills.md` endpoint on `revshare.fast` (public, no secrets) per requirements.
- Implement `/revclaw/auth.md` (dynamic auth instructions; no secrets).
- Define DB schema + migrations for RevClaw entities (Agent, Registration, Installation, Intent, AuditLog).
- Implement agent register + claim flow (Telegram-first), including SSRF-safe manifest ingestion.
- Implement bot polling: claim status + exchange code.
- Implement token lifecycle (mint, refresh rotation, revoke).
- Implement intents (create, approve/deny, execute-once) and policy enforcement.
- Implement audit log (hash chain) + attribution fields.
- Build approval UX via Telegram inline buttons (and minimal web fallback if needed).
- Add rate limiting + abuse controls.
- Add negative tests for authZ invariants.

## Next
- [ ] Turn requirements into an executable Phase 0/1 plan with milestones + acceptance tests.

## Doing
- [ ] Planning & architecture: decide token format, enforcement location, and minimum viable endpoints.

## Done
- [x] RevClaw landing page (/revclaw) polish
