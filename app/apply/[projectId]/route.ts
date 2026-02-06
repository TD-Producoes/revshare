import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const POST_AUTH_INTENT_COOKIE = "post_auth_intent";
const DEFAULT_INTENT = "affiliate_apply";
const DEFAULT_SRC = "founder_site";

function sanitizeIntent(value: string | null): string {
  return value === DEFAULT_INTENT ? value : DEFAULT_INTENT;
}

function sanitizeSrc(value: string | null): string {
  if (!value) return DEFAULT_SRC;
  const cleaned = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(cleaned) ? cleaned : DEFAULT_SRC;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const intent = sanitizeIntent(searchParams.get("intent"));
  const src = sanitizeSrc(searchParams.get("src"));
  const applyTarget = `/marketer/projects/${encodeURIComponent(projectId)}?apply=true&intent=${encodeURIComponent(
    intent,
  )}&src=${encodeURIComponent(src)}`;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", applyTarget);
    loginUrl.searchParams.set("intent", intent);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(POST_AUTH_INTENT_COOKIE, applyTarget, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 30,
    });
    return response;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });
  const metadataRole =
    authUser.user_metadata?.role === "marketer" ||
    authUser.user_metadata?.role === "founder"
      ? authUser.user_metadata.role
      : null;
  const role = existingUser?.role ?? metadataRole ?? "founder";

  if (role === "marketer") {
    return NextResponse.redirect(new URL(applyTarget, request.url));
  }

  return NextResponse.redirect(new URL("/founder", request.url));
}
