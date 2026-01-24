import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const record = await prisma.attributionShortLink.findUnique({
    where: { code },
    select: { projectId: true, marketerId: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Attribution link not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const installUrl = `${origin}/api/attribution/install?projectId=${record.projectId}&marketerId=${record.marketerId}`;
  return NextResponse.redirect(installUrl);
}
