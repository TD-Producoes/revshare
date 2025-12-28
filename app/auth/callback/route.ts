import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role");
  let response = NextResponse.redirect(origin);

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
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.redirect(origin);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
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
        roleParam === "marketer" || roleParam === "creator" ? roleParam : null;
      const metadataRole =
        metadata.role === "marketer" || metadata.role === "creator"
          ? metadata.role
          : null;
      const email =
        data.user.email ??
        existing?.email ??
        `${data.user.id}@placeholder.local`;
      const role = roleFromQuery ?? metadataRole ?? existing?.role ?? "creator";
      const name =
        metadata.name ??
        metadata.full_name ??
        existing?.name ??
        email.split("@")[0] ??
        "New user";

      await prisma.user.upsert({
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
      });
    }
  }

  return response;
}
