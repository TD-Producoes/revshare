import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { platformStripe } from "@/lib/stripe";

const DEFAULT_RETURN_URL = "http://localhost:3000/creator/projects";

function decodeState(value: string | null) {
  if (!value) return { role: "creator", projectId: null };
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    if (decoded && typeof decoded.role === "string") {
      return {
        role: decoded.role,
        projectId:
          typeof decoded.projectId === "string" ? decoded.projectId : null,
      };
    }
  } catch {
    return { role: "creator", projectId: null };
  }
  return { role: "creator", projectId: null };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const stripe = platformStripe();
  const tokenResponse = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });

  const accountId = tokenResponse.stripe_user_id;
  const account = await stripe.accounts.retrieve(accountId);
  const decodedState = decodeState(state);
  const projectId = decodedState.projectId;

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId in state" },
      { status: 400 },
    );
  }

  const onboardingStatus =
    account.details_submitted && account.charges_enabled
      ? "complete"
      : "pending";

  const onboardingData = {
    id: account.id,
    details_submitted: account.details_submitted,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    capabilities: account.capabilities,
    requirements: account.requirements,
  };

  const completedAt = onboardingStatus === "complete" ? new Date() : null;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      creatorStripeAccountId: account.id,
      onboardingStatus,
      onboardingData,
      onboardingCompletedAt: completedAt,
    },
  });

  const returnUrl = process.env.ACCOUNT_LINK_RETURN_URL ?? DEFAULT_RETURN_URL;
  const redirectUrl = new URL(returnUrl);
  redirectUrl.pathname = `/creator/projects/${projectId}`;
  redirectUrl.searchParams.set("onboarding", "return");
  redirectUrl.searchParams.set("accountId", account.id);

  return NextResponse.redirect(redirectUrl.toString());
}
