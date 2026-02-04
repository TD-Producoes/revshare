import Link from "next/link";

import { RevclawShell } from "@/app/revclaw/_components/revclaw-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <RevclawShell>
        <Alert className="border-white/10 bg-white/[0.04] text-white">
          <AlertTitle>Missing claim_id</AlertTitle>
          <AlertDescription className="text-white/60">
            This claim link is invalid.
          </AlertDescription>
        </Alert>
      </RevclawShell>
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
      <RevclawShell>
        <Alert className="border-white/10 bg-white/[0.04] text-white">
          <AlertTitle>Invalid claim link</AlertTitle>
          <AlertDescription className="text-white/60">
            This approval link is invalid or expired.
          </AlertDescription>
        </Alert>
      </RevclawShell>
    );
  }

  const expired = registration.expiresAt < new Date();
  const canAct = registration.status === "PENDING" && !expired;

  return (
    <RevclawShell>
      <div className="mb-6">
        <h1
          className="text-balance text-3xl font-black tracking-tight"
          style={{ fontFamily: "Clash Display, system-ui, sans-serif" }}
        >
          Approve RevClaw Agent
        </h1>
        <p className="mt-2 text-sm text-white/60">
          You are about to link a bot to your RevShare account.
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white ring-0">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Review request</CardTitle>
          <CardDescription className="text-white/60">
            Security: never approve a bot you don’t recognize. Approval links are
            short-lived and single-use.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div>
              <span className="font-semibold">Agent:</span>{" "}
              <span className="text-white/80">{registration.agent.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <Badge variant={canAct ? "warning" : "secondary"}>
                {registration.status}
              </Badge>
            </div>
            <div>
              <span className="font-semibold">Expires:</span>{" "}
              <span className="text-white/70">
                {registration.expiresAt.toISOString()}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Requested scopes</div>
            <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
              {JSON.stringify(registration.requestedScopes ?? [], null, 2)}
            </pre>
          </div>

          {!authUser ? (
            <Alert className="border-white/10 bg-white/[0.04] text-white">
              <AlertTitle>Login required</AlertTitle>
              <AlertDescription className="text-white/60">
                Please log in to approve.
              </AlertDescription>
              <div className="mt-3">
                <Button asChild>
                  <Link
                    href={`/login?next=/revclaw/claim?claim_id=${encodeURIComponent(
                      claim_id,
                    )}`}
                  >
                    Log in
                  </Link>
                </Button>
              </div>
            </Alert>
          ) : expired ? (
            <Alert
              variant="destructive"
              className="border-destructive/40 bg-white/[0.04]"
            >
              <AlertTitle>Expired</AlertTitle>
              <AlertDescription>This claim link has expired.</AlertDescription>
            </Alert>
          ) : registration.status !== "PENDING" ? (
            <Alert className="border-white/10 bg-white/[0.04] text-white">
              <AlertTitle>No action required</AlertTitle>
              <AlertDescription className="text-white/60">
                This claim is already {registration.status.toLowerCase()}.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        <CardFooter className="border-t border-white/10 justify-end gap-2">
          {authUser && canAct ? (
            <>
              <form
                method="post"
                action={`/api/revclaw/claims/${encodeURIComponent(claim_id)}/deny`}
              >
                <Button type="submit" variant="outline">
                  Deny
                </Button>
              </form>
              <form
                method="post"
                action={`/api/revclaw/claims/${encodeURIComponent(
                  claim_id,
                )}/approve`}
              >
                <Button type="submit">Approve</Button>
              </form>
            </>
          ) : null}
        </CardFooter>
      </Card>
    </RevclawShell>
  );
}
