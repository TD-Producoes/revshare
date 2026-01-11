# User Metadata Service

Centralized service for managing user metadata including social media profiles.

## Overview

The user metadata service provides a consistent, type-safe way to store and retrieve user social media information and other profile data in the database's `metadata` JSON field.

## Database Schema

The `User` model includes a `metadata` JSON field:

```prisma
model User {
  // ... other fields
  metadata Json?
  // ... other fields
}
```

## Metadata Structure

```typescript
{
  socialMedia: {
    x: {
      handle: "username",
      url: "https://x.com/username",  // Optional, auto-generated if not provided
      followerCount: 1234,              // Optional
      verified: true,                   // Optional
      lastUpdated: "2024-01-01T00:00:00Z" // Optional
    },
    linkedin: {
      handle: "username",
      // ... same structure
    },
    github: {
      handle: "username",
      // ... same structure
    },
    youtube: {
      handle: "username",
      // ... same structure
    },
    instagram: {
      handle: "username",
      // ... same structure
    }
  },
  bio: "User bio text",           // Optional
  location: "San Francisco, CA",  // Optional
  website: "https://example.com", // Optional
  timezone: "America/Los_Angeles" // Optional
}
```

## Usage Examples

### Importing

```typescript
import {
  getSocialMediaProfile,
  setSocialMediaProfile,
  getAllSocialMedia,
  formatFollowerCount,
  getSocialMediaUrl,
  isValidHandle,
} from "@/lib/services/user-metadata";
```

### Reading Social Media Profiles

```typescript
// Get a specific platform's profile
const xProfile = getSocialMediaProfile(user.metadata, "x");
if (xProfile) {
  console.log(xProfile.handle); // "username"
  console.log(xProfile.followerCount); // 1234
}

// Get all social media profiles
const allProfiles = getAllSocialMedia(user.metadata);
console.log(allProfiles.x?.handle); // "username"
console.log(allProfiles.linkedin?.handle); // "linkedinuser"
```

### Setting Social Media Profiles

```typescript
// Add or update a profile
const updatedMetadata = setSocialMediaProfile(
  user.metadata,
  "x",
  {
    handle: "newusername",
    followerCount: 5000,
    verified: true,
  }
);

// Save to database
await prisma.user.update({
  where: { id: userId },
  data: { metadata: updatedMetadata },
});
```

### Removing Social Media Profiles

```typescript
const updatedMetadata = removeSocialMediaProfile(user.metadata, "x");

await prisma.user.update({
  where: { id: userId },
  data: { metadata: updatedMetadata },
});
```

### Formatting and Validation

```typescript
// Format follower count for display
formatFollowerCount(1234); // "1.2K"
formatFollowerCount(1234567); // "1.2M"

// Generate social media URL from handle
getSocialMediaUrl("x", "username"); // "https://x.com/username"
getSocialMediaUrl("linkedin", "username"); // "https://linkedin.com/in/username"

// Validate handle format
isValidHandle("valid_username", "x"); // true
isValidHandle("invalid username!", "x"); // false
isValidHandle("toolonghandle123456789", "x"); // false (X max 15 chars)
```

## API Integration

When fetching user data with social media info:

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    metadata: true, // Include metadata
  },
});
```

## UI Display Example

```typescript
// In a React component
const xProfile = getSocialMediaProfile(user.metadata, "x");

{xProfile && (
  <a
    href={getSocialMediaUrl("x", xProfile.handle)}
    target="_blank"
    rel="noopener noreferrer"
  >
    @{xProfile.handle}
    {xProfile.followerCount && (
      <span>· {formatFollowerCount(xProfile.followerCount)} followers</span>
    )}
  </a>
)}
```

## Migration

To enable the metadata field, run:

```bash
npx prisma migrate dev --name add_user_metadata
```

Or apply with:

```bash
npx prisma db push
```

Then regenerate the Prisma client:

```bash
npx prisma generate
```

## Supported Platforms

- **X (Twitter)**: Handle validation (1-15 chars)
- **LinkedIn**: Handle validation (3-100 chars)
- **GitHub**: Handle validation (1-39 chars)
- **YouTube**: Handle validation (3-30 chars)
- **Instagram**: Handle validation (1-30 chars)

## Best Practices

1. **Always validate handles** before saving using `isValidHandle()`
2. **Use the service functions** instead of directly accessing the JSON structure
3. **Handle null/undefined gracefully** when reading metadata
4. **Update follower counts periodically** if displaying them
5. **Store handles without @ prefix** - the service handles formatting

## Type Safety

The service provides full TypeScript type safety:

```typescript
type SocialMediaPlatform = "x" | "linkedin" | "github" | "youtube" | "instagram";

interface SocialMediaProfile {
  handle: string;
  url?: string;
  followerCount?: number;
  verified?: boolean;
  lastUpdated?: Date | string;
}

interface UserMetadata {
  socialMedia?: UserSocialMedia;
  bio?: string;
  location?: string;
  website?: string;
  timezone?: string;
  [key: string]: unknown; // Extensible for future fields
}
```

## Extensibility

The metadata structure is designed to be extensible. You can add new fields to `UserMetadata` without breaking existing code:

```typescript
const metadata = parseUserMetadata(user.metadata);
// Add custom fields
const updatedMetadata = {
  ...metadata,
  customField: "value",
};
```
