import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/marketer/invitations/:id
 *
 * Fetch a single invitation by ID for the current marketer.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await params;

    const invitation = await prisma.projectInvitation.findFirst({
      where: {
        id,
        marketerId: authUser.id,
      },
      select: {
        id: true,
        status: true,
        message: true,
        commissionPercentSnapshot: true,
        refundWindowDaysSnapshot: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        founder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    return NextResponse.json({ data: invitation });
  } catch (err) {
    return authErrorResponse(err);
  }
}
