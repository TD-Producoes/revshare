import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

type OptionRow = {
  projectId: string;
  projectName: string;
  counterpartyId: string;
  counterpartyName: string | null;
  counterpartyEmail: string | null;
  kind: "FOUNDER_TO_MARKETER" | "MARKETER_TO_FOUNDER";
};

/**
 * GET /api/chat/conversations/options
 *
 * Returns a list of possible (project, counterparty) pairs to start a conversation.
 *
 * - If viewer is founder: show marketers connected to viewer's projects.
 * - If viewer is marketer: show founders connected to viewer through projects.
 */
export async function GET() {
  try {
    const authUser = await requireAuthUser();

    // Founder side: marketers from founder projects with either invitation or approved contract
    const founderProjects = await prisma.project.findMany({
      where: { userId: authUser.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    });

    const founderProjectIds = founderProjects.map((p) => p.id);

    const founderPairs: OptionRow[] = founderProjectIds.length
      ? await (async () => {
          const [invites, contracts] = await Promise.all([
            prisma.projectInvitation.findMany({
              where: {
                projectId: { in: founderProjectIds },
                status: { not: "REVOKED" },
              },
              select: {
                projectId: true,
                marketer: { select: { id: true, name: true, email: true } },
              },
            }),
            prisma.contract.findMany({
              where: {
                projectId: { in: founderProjectIds },
                status: "APPROVED",
              },
              select: {
                projectId: true,
                user: { select: { id: true, name: true, email: true } },
              },
            }),
          ]);

          const projectNameById = new Map(founderProjects.map((p) => [p.id, p.name] as const));

          const uniq = new Set<string>();
          const out: OptionRow[] = [];

          for (const row of invites) {
            const key = `${row.projectId}:${row.marketer.id}`;
            if (uniq.has(key)) continue;
            uniq.add(key);
            out.push({
              projectId: row.projectId,
              projectName: projectNameById.get(row.projectId) ?? "Project",
              counterpartyId: row.marketer.id,
              counterpartyName: row.marketer.name,
              counterpartyEmail: row.marketer.email,
              kind: "FOUNDER_TO_MARKETER",
            });
          }

          for (const row of contracts) {
            const key = `${row.projectId}:${row.user.id}`;
            if (uniq.has(key)) continue;
            uniq.add(key);
            out.push({
              projectId: row.projectId,
              projectName: projectNameById.get(row.projectId) ?? "Project",
              counterpartyId: row.user.id,
              counterpartyName: row.user.name,
              counterpartyEmail: row.user.email,
              kind: "FOUNDER_TO_MARKETER",
            });
          }

          // Keep stable ordering by project recency (already in founderProjects), then name
          out.sort((a, b) => {
            if (a.projectId !== b.projectId) {
              return founderProjectIds.indexOf(a.projectId) - founderProjectIds.indexOf(b.projectId);
            }
            const an = (a.counterpartyName ?? a.counterpartyEmail ?? a.counterpartyId).toLowerCase();
            const bn = (b.counterpartyName ?? b.counterpartyEmail ?? b.counterpartyId).toLowerCase();
            return an.localeCompare(bn);
          });

          return out;
        })()
      : [];

    // Marketer side: founders from marketer projects (via invitation or approved contract)
    const marketerInvites = await prisma.projectInvitation.findMany({
      where: {
        marketerId: authUser.id,
        status: { not: "REVOKED" },
      },
      select: {
        projectId: true,
        project: { select: { id: true, name: true, userId: true, user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const marketerContracts = await prisma.contract.findMany({
      where: {
        userId: authUser.id,
        status: "APPROVED",
      },
      select: {
        projectId: true,
        project: { select: { id: true, name: true, userId: true, user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const marketerUniq = new Set<string>();
    const marketerPairs: OptionRow[] = [];

    for (const row of [...marketerInvites, ...marketerContracts]) {
      const founder = row.project.user;
      const key = `${row.projectId}:${founder.id}`;
      if (marketerUniq.has(key)) continue;
      marketerUniq.add(key);
      marketerPairs.push({
        projectId: row.projectId,
        projectName: row.project.name,
        counterpartyId: founder.id,
        counterpartyName: founder.name,
        counterpartyEmail: founder.email,
        kind: "MARKETER_TO_FOUNDER",
      });
    }

    // Prefer newest projects first (from orderBy), then name
    marketerPairs.sort((a, b) => {
      if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
      const an = (a.counterpartyName ?? a.counterpartyEmail ?? a.counterpartyId).toLowerCase();
      const bn = (b.counterpartyName ?? b.counterpartyEmail ?? b.counterpartyId).toLowerCase();
      return an.localeCompare(bn);
    });

    // If the viewer owns projects, treat them as founder for this picker.
    // Otherwise, treat them as marketer.
    const options = founderProjects.length > 0 ? founderPairs : marketerPairs;

    return NextResponse.json({ data: options }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
