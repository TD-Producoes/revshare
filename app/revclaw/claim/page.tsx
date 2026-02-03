import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getAuthUserOptional } from "@/lib/auth";

export default async function RevclawClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ claim_id?: string }>;
}) {
  const { claim_id } = await searchParams;

  if (!claim_id) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">RevClaw Claim</h1>
        <p className="mt-4 text-muted-foreground">Missing claim_id.</p>
      </main>
    );
  }

  const authUser = await getAuthUserOptional();

  const registration = await prisma.revclawRegistration.findUnique({
    where: { claimId: claim_id },
    include: {
      agent: { select: { id: true, name: true } },
    },
  });

  if (!registration) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">RevClaw Claim</h1>
        <p className="mt-4 text-muted-foreground">Invalid claim link.</p>
      </main>
    );
  }

  const expired = registration.expiresAt < new Date();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Approve RevClaw Agent</h1>
      <p className="mt-2 text-muted-foreground">
        You are about to link a bot to your RevShare account.
      </p>

      <div className="mt-8 rounded-lg border border-border/40 bg-muted/10 p-6">
        <div className="text-sm text-muted-foreground">Agent</div>
        <div className="mt-1 text-lg font-semibold">{registration.agent.name}</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Requested scopes: {registration.requestedScopes?.length ? registration.requestedScopes.join(", ") : "(none)"}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Expires: {registration.expiresAt.toISOString()}
        </div>
      </div>

      {!authUser ? (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            Please log in to approve.
          </p>
          <Link
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
            href={`/login?next=/revclaw/claim?claim_id=${encodeURIComponent(claim_id)}`}
          >
            Log in
          </Link>
        </div>
      ) : expired ? (
        <div className="mt-8 rounded-lg border border-border/40 bg-muted/10 p-6">
          <p className="text-muted-foreground">This claim link has expired.</p>
        </div>
      ) : registration.status !== "PENDING" ? (
        <div className="mt-8 rounded-lg border border-border/40 bg-muted/10 p-6">
          <p className="text-muted-foreground">
            This claim is already {registration.status.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex gap-3">
          <form
            method="post"
            action={`/api/revclaw/claims/${encodeURIComponent(claim_id)}/approve`}
          >
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
              type="submit"
            >
              Approve
            </button>
          </form>
          <form
            method="post"
            action={`/api/revclaw/claims/${encodeURIComponent(claim_id)}/deny`}
          >
            <button
              className="inline-flex items-center justify-center rounded-md border border-border/40 bg-background px-4 py-2"
              type="submit"
            >
              Deny
            </button>
          </form>
        </div>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Security: never approve a bot you don’t recognize. Approval links are short-lived and single-use.
      </p>
    </main>
  );
}
