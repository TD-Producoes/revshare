const DEFAULT_PLATFORM_COMMISSION_PERCENT = 5;

function normalizePercent(value: number): number {
  return value > 1 ? value / 100 : value;
}

/**
 * Platform commission for newly created projects.
 * Source of truth is env var PLATFORM_COMMISSION_PERCENT.
 * Accepts either percent (e.g. 5) or decimal (e.g. 0.05).
 */
export function getDefaultPlatformCommissionPercent(): number {
  const raw = process.env.PLATFORM_COMMISSION_PERCENT;
  if (!raw) {
    return normalizePercent(DEFAULT_PLATFORM_COMMISSION_PERCENT);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return normalizePercent(DEFAULT_PLATFORM_COMMISSION_PERCENT);
  }

  return normalizePercent(parsed);
}
