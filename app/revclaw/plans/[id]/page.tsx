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
import {
  RevclawTable,
  RevclawTbody,
  RevclawTd,
  RevclawTh,
  RevclawThead,
  RevclawTr,
} from "@/app/revclaw/_components/revclaw-table";
import { prisma } from "@/lib/prisma";
import { getAuthUserOptional } from "@/lib/auth";
import { hashToken } from "@/lib/revclaw/crypto";
import { revclawPlanSchema } from "@/lib/revclaw/plan";

function statusVariant(
  status: string,
): "success" | "warning" | "destructive" | "outline" | "secondary" {
  if (status === "APPROVED") return "success";
  if (status === "DRAFT") return "warning";
  if (status === "EXECUTING") return "warning";
  if (status === "EXECUTED") return "secondary";
  if (status === "CANCELED") return "destructive";
  return "outline";
}

export default async function RevclawPlanReviewPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const token = typeof searchParams.token === "string" ? searchParams.token : null;
  const authUser = await getAuthUserOptional();

  const plan = await prisma.revclawPlan.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      planHash: true,
      planJson: true,
      approvalTokenHash: true,
      approvalTokenExpiresAt: true,
      approvalTokenUsedAt: true,
      executeIntentId: true,
      createdAt: true,
      installation: { select: { agent: { select: { name: true } } } },
      userId: true,
    },
  });

  return (
    <RevclawShell>
      {!plan ? (
        <Alert className="border-white/10 bg-white/[0.04] text-white">
          <AlertTitle>Plan not found</AlertTitle>
          <AlertDescription className="text-white/60">
            This plan link is invalid or expired.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-balance text-3xl font-black tracking-tight" style={{ fontFamily: "Clash Display, system-ui, sans-serif" }}>
              Review Plan
            </h1>
            <p className="mt-2 text-sm text-white/60">
              A bot proposes changes to your RevShare account.
            </p>
          </div>

          <Card className="border-white/10 bg-white/[0.04] text-white ring-0">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Plan summary</CardTitle>
              <CardDescription className="text-white/60">
                Agent: {plan.installation.agent.name}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Status:</span>
                <Badge
                  className="uppercase tracking-wide text-white/90 border-white/15 bg-white/[0.06]"
                  variant={statusVariant(plan.status)}
                >
                  {plan.status}
                </Badge>
              </div>

              {(() => {
                const parsed = revclawPlanSchema.safeParse(plan.planJson);
                if (!parsed.success) {
                  return (
                    <Alert variant="destructive" className="border-destructive/40 bg-white/[0.04]">
                      <AlertTitle>Invalid plan</AlertTitle>
                      <AlertDescription>Plan data failed validation.</AlertDescription>
                    </Alert>
                  );
                }

                const planJson = parsed.data;

                return (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Project</h3>
                        <Badge
                          variant="outline"
                          className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide border-white/15 text-white/80 bg-white/[0.04]"
                        >
                          Draft
                        </Badge>
                      </div>

                      <div className="grid gap-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                        <div className="grid gap-1">
                          <div className="text-xs text-white/60">Name</div>
                          <div className="font-semibold text-white">
                            {planJson.project.name}
                          </div>
                        </div>

                        {planJson.project.description ? (
                          <div className="grid gap-1">
                            <div className="text-xs text-white/60">Description</div>
                            <div className="text-white/80">
                              {planJson.project.description}
                            </div>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {planJson.project.website ? (
                            <div className="grid gap-1">
                              <div className="text-xs text-white/60">Website</div>
                              <div className="text-white/80 break-all">
                                {planJson.project.website}
                              </div>
                            </div>
                          ) : null}

                          {planJson.project.category ? (
                            <div className="grid gap-1">
                              <div className="text-xs text-white/60">Category</div>
                              <div className="text-white/80">
                                {planJson.project.category}
                              </div>
                            </div>
                          ) : null}

                          {planJson.project.country ? (
                            <div className="grid gap-1">
                              <div className="text-xs text-white/60">Country</div>
                              <div className="text-white/80">
                                {planJson.project.country}
                              </div>
                            </div>
                          ) : null}

                          {typeof planJson.project.refundWindowDays === "number" ? (
                            <div className="grid gap-1">
                              <div className="text-xs text-white/60">Refund window</div>
                              <div className="text-white/80">
                                {planJson.project.refundWindowDays} days
                              </div>
                            </div>
                          ) : null}

                          {typeof planJson.project.marketerCommissionPercent === "number" ? (
                            <div className="grid gap-1">
                              <div className="text-xs text-white/60">Rev share</div>
                              <div className="text-white/80">
                                {planJson.project.marketerCommissionPercent}%
                              </div>
                            </div>
                          ) : null}

                          {typeof planJson.project.platformCommissionPercent === "number" ? (
                            <div className="grid gap-1">
                              <div className="text-xs text-white/60">Platform fee</div>
                              <div className="text-white/80">
                                {planJson.project.platformCommissionPercent}%
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {planJson.invitations?.enabled ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">Invitations</h3>
                          <span className="text-xs text-white/50">
                            up to {planJson.invitations.maxMarketers ?? 20}
                          </span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {typeof planJson.invitations.commissionPercent === "number" ? (
                              <div className="grid gap-1">
                                <div className="text-xs text-white/60">Commission</div>
                                <div className="text-white/80">{planJson.invitations.commissionPercent}%</div>
                              </div>
                            ) : null}
                            {typeof planJson.invitations.refundWindowDays === "number" ? (
                              <div className="grid gap-1">
                                <div className="text-xs text-white/60">Refund window</div>
                                <div className="text-white/80">{planJson.invitations.refundWindowDays} days</div>
                              </div>
                            ) : null}
                          </div>
                          <div className="grid gap-1">
                            <div className="text-xs text-white/60">Message (sent automatically)</div>
                            <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/80">
{planJson.invitations.message}
                            </pre>
                          </div>
                          <p className="text-xs text-white/60">
                            The bot will choose up to {planJson.invitations.maxMarketers ?? 20} marketers that fit your project and send this message.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Rewards</h3>
                        <span className="text-xs text-white/50">
                          {planJson.rewards?.length ?? 0}
                        </span>
                      </div>
                      {planJson.publish?.enabled ? (
                        <p className="text-xs text-white/60">
                          Publish will only happen after Stripe is connected.
                        </p>
                      ) : null}
                      {(planJson.rewards?.length ?? 0) === 0 ? (
                        <p className="text-sm text-white/60">No rewards in this plan.</p>
                      ) : (
                        <RevclawTable>
                          <RevclawThead>
                            <RevclawTr>
                              <RevclawTh>Name</RevclawTh>
                              <RevclawTh>Milestone</RevclawTh>
                              <RevclawTh>Reward</RevclawTh>
                            </RevclawTr>
                          </RevclawThead>
                          <RevclawTbody>
                            {planJson.rewards!.map((r) => (
                              <RevclawTr key={r.client_ref}>
                                <RevclawTd className="font-medium text-white">
                                  {r.name}
                                </RevclawTd>
                                <RevclawTd className="text-white/70">
                                  {r.milestoneType} · {r.milestoneValue}
                                </RevclawTd>
                                <RevclawTd className="text-white/70">
                                  {r.rewardType}
                                </RevclawTd>
                              </RevclawTr>
                            ))}
                          </RevclawTbody>
                        </RevclawTable>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Coupon templates</h3>
                        <span className="text-xs text-white/50">
                          {planJson.couponTemplates?.length ?? 0}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        Coupon templates require Stripe Connect. If Stripe isn’t connected yet, the bot will ask you to connect Stripe and then continue execution.
                      </p>
                      {(planJson.couponTemplates?.length ?? 0) === 0 ? (
                        <p className="text-sm text-white/60">No coupon templates in this plan.</p>
                      ) : (
                        <RevclawTable>
                          <RevclawThead>
                            <RevclawTr>
                              <RevclawTh>Name</RevclawTh>
                              <RevclawTh className="text-right">Discount</RevclawTh>
                              <RevclawTh>Duration</RevclawTh>
                            </RevclawTr>
                          </RevclawThead>
                          <RevclawTbody>
                            {planJson.couponTemplates!.map((t) => (
                              <RevclawTr key={t.client_ref}>
                                <RevclawTd className="font-medium text-white">
                                  {t.name}
                                </RevclawTd>
                                <RevclawTd className="text-right text-white/70">
                                  {t.percentOff}%
                                </RevclawTd>
                                <RevclawTd className="text-white/70">
                                  {t.durationType}
                                </RevclawTd>
                              </RevclawTr>
                            ))}
                          </RevclawTbody>
                        </RevclawTable>
                      )}
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const isOwner = authUser?.id ? authUser.id === plan.userId : false;

                let tokenValid = false;
                if (token) {
                  const now = new Date();
                  tokenValid =
                    !!plan.approvalTokenHash &&
                    plan.approvalTokenHash === hashToken(token) &&
                    !plan.approvalTokenUsedAt &&
                    (!plan.approvalTokenExpiresAt || plan.approvalTokenExpiresAt > now);
                }

                if (plan.status !== "DRAFT") {
                  return (
                    <Alert className="border-white/10 bg-white/[0.04] text-white">
                      <AlertTitle>No action required</AlertTitle>
                      <AlertDescription className="text-white/60">
                        This plan is <strong>{plan.status}</strong>.
                      </AlertDescription>
                    </Alert>
                  );
                }

                if (!tokenValid && !isOwner) {
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

                if (token && !tokenValid) {
                  return (
                    <Alert variant="destructive" className="border-destructive/40 bg-white/[0.04]">
                      <AlertTitle>Invalid token</AlertTitle>
                      <AlertDescription>Invalid or expired token.</AlertDescription>
                    </Alert>
                  );
                }

                return null;
              })()}
            </CardContent>

            <CardFooter className="border-t border-white/10 justify-end gap-2">
              {(() => {
                const isOwner = authUser?.id ? authUser.id === plan.userId : false;

                let tokenValid = false;
                if (token) {
                  const now = new Date();
                  tokenValid =
                    !!plan.approvalTokenHash &&
                    plan.approvalTokenHash === hashToken(token) &&
                    !plan.approvalTokenUsedAt &&
                    (!plan.approvalTokenExpiresAt || plan.approvalTokenExpiresAt > now);
                }

                if (plan.status !== "DRAFT") return null;
                if (!tokenValid && !isOwner) return null;

                const qs = tokenValid && token ? `?token=${encodeURIComponent(token)}` : "";
                const approveUrl = `/api/revclaw/plans/${plan.id}/approve${qs}`;
                const denyUrl = `/api/revclaw/plans/${plan.id}/deny${qs}`;

                return (
                  <>
                    <form action={denyUrl} method="post">
                      <Button type="submit" variant="outline">
                        Deny
                      </Button>
                    </form>
                    <form action={approveUrl} method="post">
                      <Button type="submit">Approve plan</Button>
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
