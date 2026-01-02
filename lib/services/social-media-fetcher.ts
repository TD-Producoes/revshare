/**
 * Social Media Fetcher Service
 *
 * Fetches profile information (follower counts, etc.) from social media platforms.
 * This service is designed to be used both for immediate fetching when a user
 * adds their handle and for scheduled updates via cron jobs.
 */

import type { SocialMediaPlatform, SocialMediaProfile } from "./user-metadata";

export interface FetchedSocialProfile {
  handle: string;
  followerCount?: number;
  followingCount?: number;
  verified?: boolean;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  url: string;
  lastUpdated: string;
}

export interface FetchResult {
  success: boolean;
  data?: FetchedSocialProfile;
  error?: string;
}

/**
 * Fetch profile data from X (Twitter)
 * Note: X API requires OAuth2 credentials. For now, we use a placeholder
 * that can be implemented with proper API keys.
 */
async function fetchXProfile(handle: string): Promise<FetchResult> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `https://x.com/${cleanHandle}`;

  // TODO: Implement actual X API call when API keys are available
  // For now, return a basic profile structure
  // The X API v2 endpoint would be: GET /2/users/by/username/:username
  // Required fields: public_metrics for follower count

  // Check if X API credentials are configured
  const xBearerToken = process.env.X_BEARER_TOKEN;

  if (xBearerToken) {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/by/username/${cleanHandle}?user.fields=public_metrics,verified,profile_image_url,description`,
        {
          headers: {
            Authorization: `Bearer ${xBearerToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: "User not found on X" };
        }
        return { success: false, error: "Failed to fetch X profile" };
      }

      const data = await response.json();
      const user = data.data;

      if (!user) {
        return { success: false, error: "User not found on X" };
      }

      return {
        success: true,
        data: {
          handle: cleanHandle,
          followerCount: user.public_metrics?.followers_count,
          followingCount: user.public_metrics?.following_count,
          verified: user.verified,
          displayName: user.name,
          avatarUrl: user.profile_image_url,
          bio: user.description,
          url,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("X API error:", error);
      return { success: false, error: "Failed to connect to X API" };
    }
  }

  // Return basic profile without API data
  return {
    success: true,
    data: {
      handle: cleanHandle,
      url,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Fetch profile data from LinkedIn
 * Note: LinkedIn API requires OAuth and user consent for accessing profile data
 */
async function fetchLinkedInProfile(handle: string): Promise<FetchResult> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `https://linkedin.com/in/${cleanHandle}`;

  // LinkedIn API requires OAuth2 with user consent
  // For now, just validate the handle format and return basic info

  return {
    success: true,
    data: {
      handle: cleanHandle,
      url,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Fetch profile data from GitHub
 * GitHub API is publicly accessible for basic profile info
 */
async function fetchGitHubProfile(handle: string): Promise<FetchResult> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `https://github.com/${cleanHandle}`;

  try {
    const response = await fetch(`https://api.github.com/users/${cleanHandle}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "RevShare-App",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "User not found on GitHub" };
      }
      return { success: false, error: "Failed to fetch GitHub profile" };
    }

    const user = await response.json();

    return {
      success: true,
      data: {
        handle: cleanHandle,
        followerCount: user.followers,
        followingCount: user.following,
        displayName: user.name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        url: user.html_url,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("GitHub API error:", error);
    return { success: false, error: "Failed to connect to GitHub API" };
  }
}

/**
 * Fetch profile data from YouTube
 * Note: YouTube Data API requires an API key
 */
async function fetchYouTubeProfile(handle: string): Promise<FetchResult> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `https://youtube.com/@${cleanHandle}`;

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  if (youtubeApiKey) {
    try {
      // First, search for the channel by handle
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${youtubeApiKey}`
      );

      if (!searchResponse.ok) {
        return { success: false, error: "Failed to search YouTube channel" };
      }

      const searchData = await searchResponse.json();
      const channelId = searchData.items?.[0]?.id?.channelId;

      if (!channelId) {
        return { success: false, error: "Channel not found on YouTube" };
      }

      // Get channel statistics
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
      );

      if (!channelResponse.ok) {
        return { success: false, error: "Failed to fetch YouTube channel" };
      }

      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];

      if (!channel) {
        return { success: false, error: "Channel not found on YouTube" };
      }

      return {
        success: true,
        data: {
          handle: cleanHandle,
          followerCount: parseInt(channel.statistics.subscriberCount, 10) || undefined,
          displayName: channel.snippet.title,
          avatarUrl: channel.snippet.thumbnails?.default?.url,
          bio: channel.snippet.description,
          url: `https://youtube.com/channel/${channelId}`,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("YouTube API error:", error);
      return { success: false, error: "Failed to connect to YouTube API" };
    }
  }

  return {
    success: true,
    data: {
      handle: cleanHandle,
      url,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Fetch profile data from Instagram
 * Note: Instagram API requires Facebook Graph API access
 */
async function fetchInstagramProfile(handle: string): Promise<FetchResult> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `https://instagram.com/${cleanHandle}`;

  // Instagram requires Facebook Graph API with business account
  // For now, just validate and return basic info

  return {
    success: true,
    data: {
      handle: cleanHandle,
      url,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Main function to fetch social media profile data
 */
export async function fetchSocialMediaProfile(
  platform: SocialMediaPlatform,
  handle: string
): Promise<FetchResult> {
  const fetchers: Record<SocialMediaPlatform, (handle: string) => Promise<FetchResult>> = {
    x: fetchXProfile,
    linkedin: fetchLinkedInProfile,
    github: fetchGitHubProfile,
    youtube: fetchYouTubeProfile,
    instagram: fetchInstagramProfile,
  };

  const fetcher = fetchers[platform];
  if (!fetcher) {
    return { success: false, error: `Unsupported platform: ${platform}` };
  }

  return fetcher(handle);
}

/**
 * Convert fetched profile to storage format
 */
export function fetchedProfileToStorage(
  fetched: FetchedSocialProfile
): SocialMediaProfile {
  return {
    handle: fetched.handle,
    url: fetched.url,
    followerCount: fetched.followerCount,
    verified: fetched.verified,
    lastUpdated: fetched.lastUpdated,
  };
}

/**
 * Batch update profiles for multiple users (for cron job use)
 * Returns a map of userId -> updated profiles
 */
export async function batchUpdateProfiles(
  profiles: Array<{
    userId: string;
    platform: SocialMediaPlatform;
    handle: string;
  }>
): Promise<
  Map<
    string,
    { platform: SocialMediaPlatform; result: FetchResult }[]
  >
> {
  const results = new Map<
    string,
    { platform: SocialMediaPlatform; result: FetchResult }[]
  >();

  // Process in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async ({ userId, platform, handle }) => {
        const result = await fetchSocialMediaProfile(platform, handle);
        return { userId, platform, result };
      })
    );

    for (const settledResult of batchResults) {
      if (settledResult.status === "fulfilled") {
        const { userId, platform, result } = settledResult.value;
        const userResults = results.get(userId) ?? [];
        userResults.push({ platform, result });
        results.set(userId, userResults);
      }
    }

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < profiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
