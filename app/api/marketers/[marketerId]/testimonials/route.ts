import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type MarketerTestimonial = {
  id: string;
  contractId: string;
  creatorId: string;
  creatorName: string;
  projectId: string;
  projectName: string;
  rating: number;
  text: string;
  createdAt: string | Date;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketerId: string }> }
) {
  const { marketerId } = await params;

  // Verify the marketer exists
  const marketer = await prisma.user.findUnique({
    where: { id: marketerId },
    select: { id: true, role: true },
  });

  if (!marketer || marketer.role !== "marketer") {
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

  const data: MarketerTestimonial[] = testimonials.map((testimonial) => ({
    id: testimonial.id,
    contractId: testimonial.contractId,
    creatorId: testimonial.creatorId,
    creatorName: testimonial.creator.name,
    projectId: testimonial.projectId,
    projectName: testimonial.project.name,
    rating: testimonial.rating,
    text: testimonial.text,
    createdAt: testimonial.createdAt,
  }));

  return NextResponse.json({ data });
}

