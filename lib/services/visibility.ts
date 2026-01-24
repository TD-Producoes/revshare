import { UserMetadata, UserSocialMedia } from "@/lib/services/user-metadata";
import { Project, VisibilityMode } from "@prisma/client";

/**
 * Interface for project data that needs redaction.
 * Flexible enough to handle both full Prisma objects and partial search results.
 */
export interface RedactableProject {
  id: string;
  name: string;
  visibility?: VisibilityMode | string;
  website?: string | null;
  appStoreUrl?: string | null;
  playStoreUrl?: string | null;
  logoUrl?: string | null;
  imageUrls?: string[] | null;
  description?: string | null;
  about?: string | null;
  showMrr?: boolean;
  showRevenue?: boolean;
  showStats?: boolean;
  showAvgCommission?: boolean;
  user?: { id: string; name: string } | null;
  [key: string]: unknown; // Allow for other fields like 'revenue', 'marketers' from search
}

/**
 * Interface for user data that needs redaction.
 */
export interface RedactableUser {
  id: string;
  name: string | null;
  visibility?: VisibilityMode | string;
  email?: string | null;
  metadata?: unknown;
  [key: string]: unknown;
}

/**
 * Redacts a project's sensitive data based on its visibility settings and requester's ownership.
 * @param project The project object.
 * @param isOwner Whether the requester is the owner of the project.
 */
export function redactProjectData<T extends RedactableProject>(
  project: T,
  isOwner: boolean
): T | null {
  if (isOwner) return project;

  const visibility = project.visibility || VisibilityMode.PUBLIC;
  if (visibility === VisibilityMode.PRIVATE) {
    return null;
  }

  const redacted = { ...project };

  // Handle Ghost Mode
  if (visibility === VisibilityMode.GHOST) {
    redacted.name = "Anonymous Project";
    redacted.website = null;
    redacted.appStoreUrl = null;
    redacted.playStoreUrl = null;
    redacted.logoUrl = null;
    if (redacted.imageUrls) redacted.imageUrls = [];
    redacted.description = "This project identity is private.";
    redacted.about = "Identity hidden by founder.";
    if (redacted.user) {
      redacted.user = { id: redacted.user.id, name: "Anonymous" };
    }
  }

  return redacted;
}

/**
 * Redacts a marketer's sensitive data based on its visibility settings and requester's ownership.
 * @param user The user/marketer object.
 * @param isSelf Whether the requester is the marketer themselves.
 */
export function redactMarketerData<T extends RedactableUser>(
  user: T,
  isSelf: boolean
): T | null {
  if (isSelf) return user;

  const visibility = user.visibility || VisibilityMode.PUBLIC;
  if (visibility === VisibilityMode.PRIVATE) {
    return null;
  }

  const redacted = { ...user };

  if (visibility === VisibilityMode.GHOST) {
    // In GHOST mode, completely hide identity - return null for name and email
    redacted.name = null;
    redacted.email = null;
    if (redacted.metadata) {
      // Deeply redact metadata if necessary
      let metadata: UserMetadata = redacted.metadata as UserMetadata;
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = {} as UserMetadata;
        }
      }
      if (metadata) {
        metadata = { ...metadata } as UserMetadata;
        metadata.bio = undefined; // Hide bio in GHOST mode
        metadata.socialMedia = {} as UserSocialMedia;
        metadata.location = undefined;
        metadata.website = undefined;
        redacted.metadata = metadata;
      }
    }
  }

  return redacted;
}

export type VisibilityConfig = {
  visibility: VisibilityMode;
  showMrr: boolean;
  showRevenue: boolean;
  showStats: boolean;
  showAvgCommission: boolean;
};

export function getProjectVisibility(project: Project): VisibilityConfig {
  return {
    visibility: project.visibility || VisibilityMode.PUBLIC,
    showMrr: project.showMrr ?? true,
    showRevenue: project.showRevenue ?? true,
    showStats: project.showStats ?? true,
    showAvgCommission: project.showAvgCommission ?? true,
  };
}
