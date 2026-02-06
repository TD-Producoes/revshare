import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSafeNextPath } from "@/lib/utils/safe-redirect";

const POST_AUTH_INTENT_COOKIE = "post_auth_intent";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role");
  const safeNextFromQuery = getSafeNextPath(searchParams.get("next"));
  const safeNextFromCookie = getSafeNextPath(
    request.cookies.get(POST_AUTH_INTENT_COOKIE)?.value
  );
  let redirectUrl = origin;
  const cookiesToApply: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToApply.push(...cookiesToSet);
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const metadata = data.user.user_metadata ?? {};
      const existing = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { role: true, name: true, email: true },
      });
      const roleFromQuery =
        roleParam === "marketer" || roleParam === "founder" ? roleParam : null;
      const metadataRole =
        metadata.role === "marketer" || metadata.role === "founder"
          ? metadata.role
          : null;
      const email =
        data.user.email ??
        existing?.email ??
        `${data.user.id}@placeholder.local`;
      const role = roleFromQuery ?? metadataRole ?? existing?.role ?? "founder";
      const name =
        metadata.name ??
        metadata.full_name ??
        existing?.name ??
        email.split("@")[0] ??
        "New user";

      const updatedUser = await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email,
          name,
          role,
        },
        create: {
          id: data.user.id,
          email,
          name,
          role,
        },
        select: { role: true },
      });

      const roleHome =
        updatedUser.role === "marketer"
          ? "/marketer"
          : "/founder";
      const redirectPath = safeNextFromQuery ?? safeNextFromCookie ?? roleHome;
      redirectUrl = `${origin}${redirectPath}`;
    }
  }

  const response = NextResponse.redirect(redirectUrl);
  cookiesToApply.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  response.cookies.delete(POST_AUTH_INTENT_COOKIE);

  return response;
}
