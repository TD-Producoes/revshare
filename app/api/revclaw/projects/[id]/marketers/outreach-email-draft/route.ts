import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  authenticateAgent,
  authErrorResponse,
  requireScope,
} from "@/lib/revclaw/auth";
import { parseUserMetadata } from "@/lib/services/user-metadata";

const inputSchema = z.object({
  marketer_id: z.string().min(1),
  extra_note: z.string().max(2000).optional().nullable(),
});

/**
 * POST /api/revclaw/projects/:id/marketers/outreach-email-draft
 *
 * Generates an email draft that the HUMAN can send to a marketer.
 * This endpoint does NOT send emails.
 *
 * Auth: RevClaw access token
 * Scopes: outreach:draft (and marketers:read)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const agent = await authenticateAgent(request);
    requireScope(agent, "marketers:read");
    requireScope(agent, "outreach:draft");

    const { id: projectId } = await params;

    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, name: true, category: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== agent.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const marketer = await prisma.user.findUnique({
      where: { id: parsed.data.marketer_id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        visibility: true,
        metadata: true,
      },
    });

    if (!marketer || marketer.role !== "marketer") {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    // Only allow drafting an email if marketer email is visible.
    // (If GHOST, email is hidden; bot can still draft a message for the founder to send via other channels.)
    const to =
      marketer.visibility === "GHOST" || !marketer.email ? null : marketer.email;

    const meta = parseUserMetadata(marketer.metadata);
    const marketerName = marketer.name ?? "there";

    const projectUrl = `${process.env.BASE_URL ?? "https://revshare.fast"}/projects/${project.id}`;

    const subject = `Partnership opportunity: ${project.name} on RevShare`;

    const lines: string[] = [];
    lines.push(`Hi ${marketerName},`);
    lines.push("");
    lines.push(
      `I’m reaching out because your profile on RevShare looks like a good fit for ${project.name}${project.category ? ` (${project.category})` : ""}.`,
    );
    lines.push("");
    lines.push(`Project page: ${projectUrl}`);
    lines.push("");
    lines.push(
      `If you're interested, I’d love to share commission terms and get you set up with an affiliate coupon.`,
    );

    if (meta.specialties?.length) {
      lines.push("");
      lines.push(`(I noticed your specialties: ${meta.specialties.join(", ")})`);
    }

    if (parsed.data.extra_note) {
      lines.push("");
      lines.push(parsed.data.extra_note);
    }

    lines.push("");
    lines.push("Best,");
    lines.push(agent.userId);

    const body = lines.join("\n");

    const mailto = to
      ? `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : null;

    return NextResponse.json(
      {
        data: {
          to,
          subject,
          body,
          mailto,
          context: {
            marketer: {
              id: marketer.id,
              name: marketer.name,
              email: to,
              visibility: marketer.visibility,
            },
            project: { id: project.id, name: project.name, url: projectUrl },
          },
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
