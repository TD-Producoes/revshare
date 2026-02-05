import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authenticateAgent, authErrorResponse, requireScope } from "@/lib/revclaw/auth";

const schema = z.object({
  couponCode: z.string().min(3),
  discountPercent: z.number().int().min(1).max(100),
  attributionUrl: z.string().url(),
  angle: z.enum(["short", "twitter", "linkedin", "reddit", "email"]).optional().default("short"),
});

/**
 * POST /api/revclaw/projects/:id/promo-content-draft
 *
 * Generates copy drafts for the marketer to advertise a project.
 * This endpoint does NOT publish anything.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "outreach:draft");

    const { id: projectId } = await params;

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, description: true, website: true, category: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const headline = `${project.name}: ${input.discountPercent}% off with code ${input.couponCode}`;
    const urlLine = `Use link: ${input.attributionUrl}`;

    const basePitch = project.description
      ? project.description
      : project.website
        ? `Check it out at ${project.website}`
        : `Discover ${project.name}`;

    const variants: Record<string, { title: string; body: string }> = {};

    variants.short = {
      title: "Short",
      body: `Hello! Quick deal: ${headline}. ${basePitch}. ${urlLine}`,
    };

    variants.twitter = {
      title: "X/Twitter",
      body: `Hello! ${project.name} is offering ${input.discountPercent}% off. Use code ${input.couponCode} ✅\n\n${input.attributionUrl}`,
    };

    variants.linkedin = {
      title: "LinkedIn",
      body: `Hello! If you’re exploring ${project.category ?? "new tools"}, you might like ${project.name}.\n\nThey’re offering ${input.discountPercent}% off with coupon code ${input.couponCode}.\n\n${input.attributionUrl}`,
    };

    variants.reddit = {
      title: "Reddit",
      body: `Hello! Sharing a discount for ${project.name}: ${input.discountPercent}% off with code ${input.couponCode}.\n\nLink: ${input.attributionUrl}\n\n(If this isn’t appropriate for this sub, happy to delete.)`,
    };

    variants.email = {
      title: "Email",
      body: `Subject: ${project.name} — ${input.discountPercent}% discount\n\nHello,\n\nIf you’re interested in ${project.category ?? "this"}, ${project.name} is offering ${input.discountPercent}% off.\n\nCoupon code: ${input.couponCode}\nLink: ${input.attributionUrl}\n\nBest,`,
    };

    const pick = input.angle;

    return NextResponse.json(
      {
        data: {
          project: { id: project.id, name: project.name },
          coupon: { code: input.couponCode, percentOff: input.discountPercent },
          attribution: { url: input.attributionUrl },
          variants,
          recommended: variants[pick],
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
