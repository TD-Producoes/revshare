export function getSafeNextPath(candidate: string | null | undefined): string | null {
  if (!candidate) return null;

  const value = candidate.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  return value;
}
