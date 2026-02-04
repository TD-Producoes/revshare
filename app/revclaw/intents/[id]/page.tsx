import Link from "next/link";

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
import { hashToken } from "@/lib/revclaw/crypto";
import { RevclawShell } from "@/app/revclaw/_components/revclaw-shell";

function formatKind(kind: string): string {
  if (kind === "PROJECT_PUBLISH") return "publish a project";
  if (kind === "APPLICATION_SUBMIT") return "submit an application";
  if (kind === "COUPON_TEMPLATE_CREATE") return "create a coupon template";
  if (kind === "PLAN_EXECUTE") return "execute a plan";
  return kind.toLowerCase().replace(/_/g, " ");
}

function statusBadgeVariant(
  status: string,
): "success" | "warning" | "destructive" | "outline" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING_APPROVAL") return "warning";
  if (status === "DENIED" || status === "EXPIRED") return "destructive";
  return "outline";
}

export default async function RevclawIntentReviewPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const token = typeof searchParams.token === "string" ? searchParams.token : null;

  const intent = await prisma.revclawIntent.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      status: true,
      expiresAt: true,
      payloadJson: true,
      approvalTokenHash: true,
      approvalTokenExpiresAt: true,
      approvalTokenUsedAt: true,
      installation: {
        select: {
          agent: { select: { name: true } },
        },
      },
    },
  });

  return (
    <RevclawShell>
      {!intent ? (
        <Alert className="border-white/10 bg-white/[0.04] text-white">
          <AlertTitle>Intent not found</AlertTitle>
          <AlertDescription className="text-white/60">
            This approval link is invalid or expired.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <h1
              className="text-balance text-3xl font-black tracking-tight"
              style={{ fontFamily: "Clash Display, system-ui, sans-serif" }}
            >
              Approve RevClaw Action
            </h1>
            <p className="mt-2 text-sm text-white/60">
              You are about to approve a bot action on your RevShare account.
            </p>
          </div>

          <Card className="border-white/10 bg-white/[0.04] text-white ring-0">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Review request</CardTitle>
              <CardDescription className="text-white/60">
                Security: never approve an action you don’t recognize. Approval
                links are short-lived and single-use.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-semibold">Agent:</span>{" "}
                  <span className="text-white/80">
                    {intent.installation.agent.name}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Action:</span>{" "}
                  <span className="text-white/80">{formatKind(intent.kind)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <Badge variant={statusBadgeVariant(intent.status)}>
                    {intent.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Expires:</span>{" "}
                  <span className="text-white/70">
                    {intent.expiresAt.toISOString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Details</div>
                <pre className="mt-2 max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
                  {JSON.stringify(intent.payloadJson, null, 2)}
                </pre>
              </div>

              {(() => {
                const now = new Date();
                const isExpired = intent.expiresAt.getTime() < now.getTime();
                const canAct = intent.status === "PENDING_APPROVAL" && !isExpired;

                let tokenValid = false;
                if (token) {
                  const tokenHash = hashToken(token);
                  tokenValid =
                    !!intent.approvalTokenHash &&
                    intent.approvalTokenHash === tokenHash &&
                    !intent.approvalTokenUsedAt &&
                    (!intent.approvalTokenExpiresAt ||
                      intent.approvalTokenExpiresAt.getTime() > now.getTime());
                }

                if (isExpired) {
                  return (
                    <Alert
                      variant="destructive"
                      className="border-destructive/40 bg-white/[0.04]"
                    >
                      <AlertTitle>Expired</AlertTitle>
                      <AlertDescription>
                        This intent has expired.
                      </AlertDescription>
                    </Alert>
                  );
                }

                if (!canAct) {
                  return (
                    <Alert className="border-white/10 bg-white/[0.04] text-white">
                      <AlertTitle>No action required</AlertTitle>
                      <AlertDescription className="text-white/60">
                        This intent is <strong>{intent.status}</strong>.
                      </AlertDescription>
                    </Alert>
                  );
                }

                if (!token) {
                  return (
                    <Alert className="border-white/10 bg-white/[0.04] text-white">
                      <AlertTitle>Login required</AlertTitle>
                      <AlertDescription className="text-white/60">
                        Please log in to approve.
                      </AlertDescription>
                      <div className="mt-3">
                        <Button asChild>
                          <Link href="/login">Log in</Link>
                        </Button>
                      </div>
                    </Alert>
                  );
                }

                if (!tokenValid) {
                  return (
                    <Alert
                      variant="destructive"
                      className="border-destructive/40 bg-white/[0.04]"
                    >
                      <AlertTitle>Invalid token</AlertTitle>
                      <AlertDescription>
                        Invalid or expired approval token.
                      </AlertDescription>
                    </Alert>
                  );
                }

                return null;
              })()}
            </CardContent>

            <CardFooter className="border-t border-white/10 justify-end gap-2">
              {(() => {
                const now = new Date();
                const isExpired = intent.expiresAt.getTime() < now.getTime();
                const canAct = intent.status === "PENDING_APPROVAL" && !isExpired;
                if (!canAct || !token) return null;

                const approveApiUrl = `/api/revclaw/intents/${intent.id}/approve?token=${encodeURIComponent(token)}`;
                const denyApiUrl = `/api/revclaw/intents/${intent.id}/deny?token=${encodeURIComponent(token)}`;

                return (
                  <>
                    <form action={denyApiUrl} method="post">
                      <Button type="submit" variant="outline">
                        Deny
                      </Button>
                    </form>
                    <form action={approveApiUrl} method="post">
                      <Button type="submit">Approve</Button>
                    </form>
                  </>
                );
              })()}
            </CardFooter>
          </Card>
        </>
      )}
    </RevclawShell>
  );
}
