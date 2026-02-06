# RevShare reward + metrics instructions

Purpose: canonical implementation notes for attribution, marketer/project metrics, and reward processing.

## Naming conventions
- User-facing milestone names must be `Clicks` and `Installs`.
- Attribution classification is prefix-based:
  - `deviceId` starting with `click:` => click.
  - `deviceId` starting with `install:` => install.

## Attribution pipeline (how a click/install is tied to a marketer)
- Link creation:
  - `GET /api/projects/[projectId]/attribution-link` returns marketer/project-specific short link.
- Redirect capture:
  - `/a/[code]` resolves marketer + project and stores deferred token + fallback fingerprint.
  - Fallback install URL: `/api/attribution/install?projectId=...&marketerId=...`.
- Click recording:
  - `POST /api/attribution/click` upserts `AttributionClick` by `(projectId, marketerId, deviceId)`.
  - `GET /api/attribution/install` also upserts a click with `deviceId: click:<fingerprintHash>`.
- Install resolution:
  - `/api/attribution/resolve` and `/api/attribution/resolve-token` upsert with `deviceId` prefixed by `install:`.

## Metrics architecture
- Project-level metrics table: `MetricsSnapshot`.
- Marketer+project metrics table: `MarketerMetricsSnapshot`.
- Source of truth for raw click/install events: `AttributionClick`.

## Edge functions and responsibilities
- `supabase/functions/metrics-refresh`:
  - Writes project-level metrics to `MetricsSnapshot`.
  - Must not crash whole run on per-project Stripe errors; logs them and continues.
- `supabase/functions/marketer-metrics-refresh` (+ revenuecat variant):
  - Reads `AttributionClick`.
  - Writes daily `clicksCountDay` and `installsCountDay` in `MarketerMetricsSnapshot`.
- `supabase/functions/rewards-evaluate`:
  - The only place that evaluates unlock progress and inserts `RewardEarned`.
  - Supports milestone types: `NET_REVENUE`, `COMPLETED_SALES`, `CLICKS`, `INSTALLS`.
  - Sends notification to marketer when reward is unlocked.
  - Sends notification to creator when reward is earned.

## Important rule: no duplicated reward-processing logic
- Keep reward unlock/evaluation centralized in `rewards-evaluate`.
- App routes/UI should read results (`RewardEarned`, progress APIs), not re-implement unlock computation.

## Reward unlock semantics
- Revenue/sales milestones:
  - Use eligible purchases (non-refunded/chargeback and past refund window in `rewards-evaluate` query).
- Click/install milestones:
  - Use `AttributionClick` totals since reward start date.
  - Unlock immediately at threshold.
  - No refund window gating for click/install events.

## Cash rewards for click/install milestones
- `RewardEarned` stores resolved cash fields (`rewardAmount`, `rewardCurrency`) when reward type is `MONEY`.
- Founder payouts read unlocked money rewards from `RewardEarned` via `lib/rewards/payouts.ts`.
- Stripe account presence gates transfer execution, not reward earning.

## UI behavior expectations
- Founder payouts rewards list:
  - Ordered by `earnedAt DESC`.
- Marketer dashboard "Your Active Rewards":
  - `IN_PROGRESS` rows first, then other statuses by priority.
- Marketer application metrics tab (`/marketer/applications/[id]`):
  - Uses `/api/marketer/metrics` -> `MarketerMetricsSnapshot`.
  - Requires marketer metrics refresh edge function to run for updated click/install totals.

## API notes
- `GET /api/marketer/metrics` reads snapshot tables and fills missing days with zeros.
- `GET /api/projects/[projectId]/metrics` includes project click/install totals by day.
- RevClaw reward API supports click/install milestones:
  - `POST /api/revclaw/projects/:id/rewards` accepts `milestoneType` in `["NET_REVENUE","COMPLETED_SALES","CLICKS","INSTALLS"]`.
  - Creation is draft-first and intent-gated.

## Bot/skill documentation surface
- Public bot skill doc is generated from `app/skill.md/route.ts`.
- Keep skill doc and this file aligned whenever reward/metrics behavior changes.
