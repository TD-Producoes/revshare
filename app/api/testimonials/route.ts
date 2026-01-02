import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Schema for creating a testimonial
const createTestimonialInput = z.object({
  contractId: z.string().min(1),
  creatorId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(500),
});

export async function POST(request: Request) {
  const parsed = createTestimonialInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { contractId, creatorId, rating, text } = parsed.data;

  // Verify the creator exists and is a creator
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });

  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // Verify the contract exists, is approved, and belongs to the creator
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      project: {
        select: {
          id: true,
          userId: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Verify the contract belongs to the creator's project
  if (contract.project.userId !== creatorId) {
    return NextResponse.json(
      { error: "Contract does not belong to creator" },
      { status: 403 }
    );
  }

  // Verify the contract is approved
  if (contract.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Contract must be approved to submit a testimonial" },
      { status: 400 }
    );
  }

  // Verify the contract user is a marketer
  if (contract.user.role !== "marketer") {
    return NextResponse.json(
      { error: "Contract user must be a marketer" },
      { status: 400 }
    );
  }

  // Check if a testimonial already exists for this contract
  const existingTestimonial = await prisma.testimonial.findUnique({
    where: { contractId },
    select: { id: true },
  });

  if (existingTestimonial) {
    return NextResponse.json(
      { error: "Testimonial already exists for this contract" },
      { status: 409 }
    );
  }

  // Create the testimonial
  const testimonial = await prisma.testimonial.create({
    data: {
      contractId: contract.id,
      creatorId: creator.id,
      marketerId: contract.userId,
      projectId: contract.projectId,
      rating,
      text: text.trim(),
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      marketer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      data: {
        id: testimonial.id,
        contractId: testimonial.contractId,
        creatorId: testimonial.creatorId,
        creatorName: testimonial.creator.name,
        marketerId: testimonial.marketerId,
        marketerName: testimonial.marketer.name,
        projectId: testimonial.projectId,
        projectName: testimonial.project.name,
        rating: testimonial.rating,
        text: testimonial.text,
        createdAt: testimonial.createdAt,
        updatedAt: testimonial.updatedAt,
      },
    },
    { status: 201 }
  );
}

