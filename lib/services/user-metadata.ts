/**
 * User Metadata Service
 *
 * Centralized service for managing user metadata including social media profiles.
 * This ensures consistent structure and type safety across the application.
 */

export type SocialMediaPlatform =
  | "x"
  | "linkedin"
  | "github"
  | "youtube"
  | "instagram";

export interface SocialMediaProfile {
  handle: string;
  url?: string;
  followerCount?: number;
  verified?: boolean;
  lastUpdated?: Date | string;
}

export interface UserSocialMedia {
  x?: SocialMediaProfile;
  linkedin?: SocialMediaProfile;
  github?: SocialMediaProfile;
  youtube?: SocialMediaProfile;
  instagram?: SocialMediaProfile;
}

export interface UserMetadata {
  socialMedia?: UserSocialMedia;
  bio?: string;
  location?: string;
  website?: string;
  timezone?: string;
  specialties?: string[]; // For marketers: array of specialties
  categories?: string[]; // For marketers: preferred project categories (matches project category enum list)
  focusArea?: string; // For marketers: focus area text
  [key: string]: unknown; // Allow for future extensibility
}

/**
 * Parse and validate user metadata from database JSON
 */
export function parseUserMetadata(metadata: unknown): UserMetadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }
  return metadata as UserMetadata;
}

/**
 * Get social media profile for a specific platform
 */
export function getSocialMediaProfile(
  metadata: unknown,
  platform: SocialMediaPlatform
): SocialMediaProfile | null {
  const parsed = parseUserMetadata(metadata);
  return parsed.socialMedia?.[platform] ?? null;
}

/**
 * Get all social media profiles
 */
export function getAllSocialMedia(metadata: unknown): UserSocialMedia {
  const parsed = parseUserMetadata(metadata);
  return parsed.socialMedia ?? {};
}

/**
 * Set social media profile for a specific platform
 */
export function setSocialMediaProfile(
  metadata: unknown,
  platform: SocialMediaPlatform,
  profile: SocialMediaProfile
): UserMetadata {
  const parsed = parseUserMetadata(metadata);
  return {
    ...parsed,
    socialMedia: {
      ...parsed.socialMedia,
      [platform]: profile,
    },
  };
}

/**
 * Remove social media profile for a specific platform
 */
export function removeSocialMediaProfile(
  metadata: unknown,
  platform: SocialMediaPlatform
): UserMetadata {
  const parsed = parseUserMetadata(metadata);
  if (!parsed.socialMedia) {
    return parsed;
  }
  const { [platform]: _, ...rest } = parsed.socialMedia;
  return {
    ...parsed,
    socialMedia: rest,
  };
}

/**
 * Format follower count for display (e.g., 1.2K, 3.5M)
 */
export function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Get social media URL from handle
 */
export function getSocialMediaUrl(
  platform: SocialMediaPlatform,
  handle: string
): string {
  // Remove @ prefix if present
  const cleanHandle = handle.replace(/^@/, "");

  const urls: Record<SocialMediaPlatform, string> = {
    x: `https://x.com/${cleanHandle}`,
    linkedin: `https://linkedin.com/in/${cleanHandle}`,
    github: `https://github.com/${cleanHandle}`,
    youtube: `https://youtube.com/@${cleanHandle}`,
    instagram: `https://instagram.com/${cleanHandle}`,
  };

  return urls[platform];
}

/**
 * Validate social media handle format
 */
export function isValidHandle(
  handle: string,
  platform: SocialMediaPlatform
): boolean {
  const cleanHandle = handle.replace(/^@/, "");

  // Basic validation - alphanumeric, underscores, hyphens
  const basicPattern = /^[a-zA-Z0-9_-]+$/;

  if (!basicPattern.test(cleanHandle)) {
    return false;
  }

  // Platform-specific validations
  switch (platform) {
    case "x":
      return cleanHandle.length >= 1 && cleanHandle.length <= 15;
    case "linkedin":
      return cleanHandle.length >= 3 && cleanHandle.length <= 100;
    case "github":
      return cleanHandle.length >= 1 && cleanHandle.length <= 39;
    case "youtube":
      return cleanHandle.length >= 3 && cleanHandle.length <= 30;
    case "instagram":
      return cleanHandle.length >= 1 && cleanHandle.length <= 30;
    default:
      return true;
  }
}
