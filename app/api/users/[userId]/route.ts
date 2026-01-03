import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  parseUserMetadata,
  setSocialMediaProfile,
  removeSocialMediaProfile,
  isValidHandle,
  type SocialMediaPlatform,
} from "@/lib/services/user-metadata";
import {
  fetchSocialMediaProfile,
  fetchedProfileToStorage,
} from "@/lib/services/social-media-fetcher";
import { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      stripeConnectedAccountId: true,
      stripeCustomerId: true,
      autoChargeEnabled: true,
      onboardingStatus: true,
      onboardingData: true,
      metadata: true,
      visibility: true,
    } as any,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}

const socialMediaSchema = z.object({
  handle: z.string().min(1).max(100),
  followerCount: z.number().optional(),
  verified: z.boolean().optional(),
});

const updateMetadataSchema = z.object({
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  specialties: z.array(z.string().max(100)).max(10).optional().nullable(),
  focusArea: z.string().max(100).optional().nullable(),
  socialMedia: z
    .object({
      x: socialMediaSchema.optional().nullable(),
      linkedin: socialMediaSchema.optional().nullable(),
      github: socialMediaSchema.optional().nullable(),
      youtube: socialMediaSchema.optional().nullable(),
      instagram: socialMediaSchema.optional().nullable(),
    })
    .optional(),
});

const updateSchema = z.object({
  visibility: z.enum(["PUBLIC", "GHOST", "PRIVATE"]).optional(),
  metadata: updateMetadataSchema.optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, metadata: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { visibility, metadata: metadataUpdate } = parsed.data;
  let metadata = parseUserMetadata(user.metadata);

  if (metadataUpdate) {
    const { bio, location, website, specialties, focusArea, socialMedia } = metadataUpdate;

    // Update basic profile fields
    if (bio !== undefined) {
      metadata = { ...metadata, bio: bio || undefined };
    }
    if (location !== undefined) {
      metadata = { ...metadata, location: location || undefined };
    }
    if (website !== undefined) {
      metadata = { ...metadata, website: website || undefined };
    }
    if (specialties !== undefined) {
      metadata = { ...metadata, specialties: specialties || undefined };
    }
    if (focusArea !== undefined) {
      metadata = { ...metadata, focusArea: focusArea || undefined };
    }

    // Update social media profiles
    if (socialMedia) {
      const platforms: SocialMediaPlatform[] = [
        "x",
        "linkedin",
        "github",
        "youtube",
        "instagram",
      ];

      for (const platform of platforms) {
        const profileData = socialMedia[platform];

        if (profileData === null) {
          // Remove the profile
          metadata = removeSocialMediaProfile(metadata, platform);
        } else if (profileData?.handle) {
          // Validate handle
          if (!isValidHandle(profileData.handle, platform)) {
            return NextResponse.json(
              { error: `Invalid ${platform} handle format` },
              { status: 400 }
            );
          }

          // Fetch profile data from social media platform
          const fetchResult = await fetchSocialMediaProfile(
            platform,
            profileData.handle
          );

          if (fetchResult.success && fetchResult.data) {
            // Use fetched data merged with any provided data
            const storageProfile = fetchedProfileToStorage(fetchResult.data);
            metadata = setSocialMediaProfile(metadata, platform, {
              ...storageProfile,
              // Allow overriding with provided data if API didn't return it
              followerCount:
                storageProfile.followerCount ?? profileData.followerCount,
              verified: storageProfile.verified ?? profileData.verified,
            });
          } else {
            // If fetch failed, still save the handle without additional data
            metadata = setSocialMediaProfile(metadata, platform, {
              handle: profileData.handle.replace(/^@/, ""),
              followerCount: profileData.followerCount,
              verified: profileData.verified,
              lastUpdated: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { 
      metadata: metadata as Prisma.InputJsonValue,
      ...(visibility ? { visibility } : {}),
    },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      stripeConnectedAccountId: true,
      stripeCustomerId: true,
      autoChargeEnabled: true,
      onboardingStatus: true,
      onboardingData: true,
      metadata: true,
      visibility: true,
    } as any,
  });

  return NextResponse.json({ data: updated });
}
