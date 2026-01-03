import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type MarketerTestimonial = {
  id: string;
  contractId: string;
  creatorId: string;
  creatorName: string;
  projectId: string;
  projectName: string;
  rating: number;
  text: string | null; // null in GHOST mode to protect identity
  createdAt: string | Date;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketerId: string }> }
) {
  const { marketerId } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Verify the marketer exists and check visibility
  const marketer = await prisma.user.findUnique({
    where: { id: marketerId },
    select: {
      id: true,
      role: true,
      visibility: true,
    },
  });

  if (!marketer || marketer.role !== "marketer") {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  const isSelf = authUser?.id === marketer.id;

  // If marketer is PRIVATE and not self, return 404
  if (marketer.visibility === "PRIVATE" && !isSelf) {
    return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
  }

  // Fetch testimonials for this marketer
  const testimonials = await prisma.testimonial.findMany({
    where: { marketerId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isGhost = marketer.visibility === "GHOST" && !isSelf;

  // For GHOST marketers, return testimonials but hide the text (only show rating)
  // This allows showing ratings while protecting identity
  const data: MarketerTestimonial[] = testimonials.map((testimonial) => ({
    id: testimonial.id,
    contractId: testimonial.contractId,
    creatorId: testimonial.creatorId,
    creatorName: testimonial.creator.name,
    projectId: testimonial.projectId,
    projectName: testimonial.project.name,
    rating: testimonial.rating,
    text: isGhost ? null : testimonial.text, // Hide text for GHOST marketers
    createdAt: testimonial.createdAt,
  }));

  return NextResponse.json({ data });
}
