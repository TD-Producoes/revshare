"use client";

import { useQuery } from "@tanstack/react-query";

import { BotsTable } from "@/components/creator/bots-table";

export type RevclawInstallationListItem = {
  id: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  grantedScopes: string[];
  requireApprovalForPublish: boolean;
  requireApprovalForApply: boolean;
  dailyApplyLimit: number | null;
  allowedCategories: string[];
  createdAt: string;
  lastTokenIssuedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  agent: {
    id: string;
    name: string;
    manifestUrl: string | null;
    manifestSnapshotHash: string;
    identityProofUrl: string | null;
    metadata: unknown;
    createdAt: string;
  };
};

export function BotsList({ baseHref = "/founder/bots" }: { baseHref?: string } = {}) {
  const { data, isLoading, isError } = useQuery<{ data: RevclawInstallationListItem[] }>(
    {
      queryKey: ["revclaw-installations"],
      queryFn: async () => {
        const res = await fetch("/api/revclaw/installations");
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load bot installations");
        }
        return json;
      },
    },
  );

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-muted-foreground">
        Unable to load bots.
      </div>
    );
  }

  const installations = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bots</h1>
        <p className="text-muted-foreground">
          Manage bots connected to your account (RevClaw installations).
        </p>
      </div>

      <BotsTable installations={installations} baseHref={baseHref} />
    </div>
  );
}
