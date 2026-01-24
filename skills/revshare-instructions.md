# RevShare metrics instructions

Purpose: guide edits to metrics logic across founder/marketer pages, APIs, and Supabase edge functions.

## Core data sources
- Daily metrics come from `MetricsSnapshot` (project-level) and `MarketerMetricsSnapshot` (marketer+project level).
- `metrics-refresh` (Supabase) writes `MetricsSnapshot` daily + cumulative fields.
- `marketer-metrics-refresh` and `marketer-metrics-refresh-revenuecat` write `MarketerMetricsSnapshot` daily totals.

## Affiliate attribution rules
- Stripe purchases: affiliate if `couponId` exists.
- RevenueCat purchases: affiliate if `revenueCatEventId` exists AND `marketerId` exists.
- Customer identity:
  - Stripe: `customerEmail` (lowercased) when present.
  - RevenueCat: `customerExternalId` (stored from `original_app_user_id` or `app_user_id`).
- Affiliate customer counts are distinct customer identifiers within the scope (daily/all-time).

## MetricsSnapshot fields
- Daily: `totalRevenueDay`, `affiliateRevenueDay`, `purchasesCountDay`, `affiliatePurchasesCountDay`, `uniqueCustomersDay`, `affiliateCustomersDay`.
- Cumulative: `totalRevenue`, `affiliateRevenue`, `purchasesCount`, `affiliatePurchasesCount`, `uniqueCustomers`, `affiliateCustomers`.
- Past-day upserts must include cumulative fields to satisfy NOT NULL constraints.

## MarketerMetricsSnapshot fields
- Per marketer+project day: revenue, commission, purchases, customers, clicks, installs.
- Clicks vs installs:
  - `deviceId` prefix `click:` counts as click.
  - `deviceId` prefix `install:` counts as install.

## API endpoints
- `GET /api/marketer/metrics`: marketer-only timeline + project totals per day.
  - Includes `projectPurchasesCount` and `projectCustomersCount` from `MetricsSnapshot` for totals.
  - Fills missing days with zeros (no gaps in charts).
- `GET /api/founder/marketers/[marketerId]/metrics`: marketer data + project totals.
  - Aggregates totals across selected projects when no project filter.
  - Fills missing days with zeros.
- `GET /api/projects/[projectId]/metrics`: project totals (all marketers), includes clicks/installs by day.
  - Fills missing days with zeros.

## UI chart usage
- `RevenueChart` is the canonical chart styling for dual-series (Total vs Affiliate).
- `MarketerMetricsTab`:
  - Purchases chart uses `RevenueChart` with `projectPurchasesCount` (total) + `purchasesCount` (affiliate).
  - Customers chart uses `projectCustomersCount` (total) + `customersCount` (affiliate).
  - If totals are not provided, show only affiliate series.

## Page-specific expectations
- `/marketer/applications/[slug]`:
  - Affiliate series = logged-in marketer data.
  - Project totals from `/api/marketer/metrics` totals per day.
- `/founder/projects/[slug]` metrics tab:
  - Affiliate series = all marketers summed.
  - Project totals from project metrics.
- `/founder/affiliates/[id]` metrics tab:
  - Affiliate series = selected marketer.
  - Project totals from `/api/founder/marketers/[marketerId]/metrics`, aggregated when no project filter.

## RevenueCat webhook
- `app/api/revenuecat/webhook/[projectId]/route.ts` writes `Purchase.customerExternalId`.
- `customerEmail` is null for RevenueCat; do not rely on it for customers.

## Attribution links
- Short link: `/a/[code]` resolves to `/api/attribution/install`.
- Install endpoint logs fingerprint and counts click.
- Resolve endpoint counts install when marketer match found.
