import { useEffect } from "react";
import { Platform, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";

type ResolveAttributionParams = {
  appKey: string;
  baseUrl?: string;
  deviceModel: string;
  osVersion: string;
  platform?: string;
  locale?: string;
  userAgent?: string;
  endpoint?: string;
};

type AttributionConfig = {
  appKey: string;
  baseUrl?: string;
  marketerParam?: string;
  endpoint?: string;
  resolveEndpoint?: string;
  resolveTokenEndpoint?: string;
  enabled?: boolean;
  deviceStorageKey?: string;
  marketerStorageKey?: string;
  dedupe?: boolean;
  syncRevenueCat?: boolean;
  revenueCatAttributeKey?: string;
  onTracked?: (result: { ok: boolean; marketerId: string; source: "universal_link" | "token" | "fingerprint" }) => void;
};

const DEFAULT_RESOLVE_ENDPOINT = "/api/attribution/resolve";
const DEFAULT_RESOLVE_TOKEN_ENDPOINT = "/api/attribution/resolve-token";
const BASE_URL = "https://revshare.fast";

export const MARKETER_ID_STORAGE_KEY = "@marketplace/attribution/marketer-id";
const RESOLVED_FLAG_STORAGE_KEY = "@marketplace/attribution/marketer-resolve/complete";

export async function getStoredMarketerId(
  storageKey: string = MARKETER_ID_STORAGE_KEY,
) {
  return AsyncStorage.getItem(storageKey);
}

export async function syncRevenueCatAttribution(options?: {
  storageKey?: string;
  attributeKey?: string;
}) {
  if (Platform.OS === "web") {
    return;
  }
  const storageKey = options?.storageKey ?? MARKETER_ID_STORAGE_KEY;
  const attributeKey = options?.attributeKey ?? "marketer_id";
  const marketerId = await getStoredMarketerId(storageKey);
  console.log("Syncing marketer ID to RevenueCat", marketerId);
  if (marketerId) {
    try {
      const Purchases = require("react-native-purchases").default;
      Purchases.setAttributes({ [attributeKey]: marketerId });
    } catch {
      // Ignore if RevenueCat isn't configured yet.
    }
  }
}

function getLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || undefined;
  } catch {
    return undefined;
  }
}

async function getDeviceInfo() {
  const platform = Platform.OS;
  let userAgent: string | undefined;
  let osVersion: string = Platform.Version ? String(Platform.Version) : "unknown";
  let deviceModel: string = platform;

  if (platform === "web" && typeof navigator !== "undefined") {
    userAgent = navigator.userAgent;
  } else {
    // Get the WebView user agent - this matches Safari's frozen UA format
    try {
      userAgent = await DeviceInfo.getUserAgent();
    } catch {
      // Fallback if getUserAgent fails
    }
  }

  // Parse OS version from user agent to match browser-reported version
  if (userAgent && platform === "ios") {
    const match = userAgent.match(/OS ([\d_]+)/i);
    if (match?.[1]) {
      osVersion = match[1].replace(/_/g, ".");
    }
  }

  // Get device model
  if (platform === "ios") {
    const model = DeviceInfo.getModel();
    if (model.toLowerCase().startsWith("iphone")) {
      deviceModel = "iPhone";
    } else if (model.toLowerCase().startsWith("ipad")) {
      deviceModel = "iPad";
    } else {
      deviceModel = model;
    }
  } else if (platform === "android") {
    deviceModel = DeviceInfo.getModel();
  }

  return {
    deviceModel,
    osVersion,
    platform,
    locale: getLocale(),
    userAgent,
  };
}

// Get token from Android Install Referrer (more reliable than clipboard on Android)
async function getAndroidReferrerToken(): Promise<string | null> {
  if (Platform.OS !== "android") return null;

  try {
    const referrer = await DeviceInfo.getInstallReferrer();
    if (referrer) {
      // Parse token=xxx from referrer string
      const match = referrer.match(/token=([A-Za-z0-9_-]+)/);
      if (match?.[1]) {
        return match[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Try to get clipboard content (for deferred deep linking - iOS only)
async function getClipboardToken(): Promise<string | null> {
  try {
    // Try to dynamically require clipboard
    const Clipboard = require("@react-native-clipboard/clipboard").default;
    const content = await Clipboard.getString();

    // Token should be base64url encoded, ~22 chars
    if (content && content.length >= 16 && content.length <= 50) {
      // Basic validation: looks like a base64url token
      if (/^[A-Za-z0-9_-]+$/.test(content)) {
        return content;
      }
    }
    return null;
  } catch {
    // Clipboard not available
    return null;
  }
}

async function clearClipboard() {
  try {
    const Clipboard = require("@react-native-clipboard/clipboard").default;
    Clipboard.setString("");
  } catch {
    // Ignore
  }
}

// Resolve marketerId from deferred token
async function resolveToken(
  appKey: string,
  baseUrl: string,
  token: string,
  endpoint: string
): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appKey, token }),
    });

    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.marketerId) {
      return payload.marketerId;
    }
    return null;
  } catch {
    return null;
  }
}

// Resolve marketerId from Universal Link URL params
function extractFromUrl(url: string): { marketerId: string | null; token: string | null } {
  try {
    // Handle both custom scheme and https URLs
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    return {
      marketerId: params.get("marketerId"),
      token: params.get("token"),
    };
  } catch {
    // Try to parse as custom scheme (app://attribution?marketerId=xxx)
    try {
      const queryStart = url.indexOf("?");
      if (queryStart === -1) return { marketerId: null, token: null };

      const queryString = url.slice(queryStart + 1);
      const params = new URLSearchParams(queryString);
      return {
        marketerId: params.get("marketerId"),
        token: params.get("token"),
      };
    } catch {
      return { marketerId: null, token: null };
    }
  }
}

async function resolveMarketerId(params: ResolveAttributionParams) {
  const response = await fetch(
    `${params.baseUrl ?? BASE_URL}${params.endpoint ?? DEFAULT_RESOLVE_ENDPOINT}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appKey: params.appKey,
        deviceModel: params.deviceModel,
        osVersion: params.osVersion,
        platform: params.platform,
        locale: params.locale,
        userAgent: params.userAgent,
      }),
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to resolve attribution");
  }
  return payload?.marketerId ?? null;
}

async function hasTracked(marketerId: string) {
  const key = `@marketplace/attribution/tracked/${marketerId}`;
  return Boolean(await AsyncStorage.getItem(key));
}

async function markTracked(marketerId: string) {
  const key = `@marketplace/attribution/tracked/${marketerId}`;
  await AsyncStorage.setItem(key, "1");
}

export function AttributionTracker(config: AttributionConfig) {
  const {
    appKey,
    baseUrl = BASE_URL,
    resolveEndpoint = DEFAULT_RESOLVE_ENDPOINT,
    resolveTokenEndpoint = DEFAULT_RESOLVE_TOKEN_ENDPOINT,
    enabled = true,
    marketerStorageKey = MARKETER_ID_STORAGE_KEY,
    dedupe = true,
    syncRevenueCat = false,
    revenueCatAttributeKey = "marketer_id",
    onTracked,
  } = config;

  useEffect(() => {
    if (!enabled) return;
    let isActive = true;

    const resolveAttribution = async () => {
      if (!isActive) return;

      const resolvedFlagKey = marketerStorageKey
        ? `${marketerStorageKey}/resolved`
        : RESOLVED_FLAG_STORAGE_KEY;

      // Check if already resolved
      if (marketerStorageKey) {
        const storedMarketerId = await AsyncStorage.getItem(marketerStorageKey);
        if (storedMarketerId) {
          return;
        }
      }
      if (await AsyncStorage.getItem(resolvedFlagKey)) {
        return;
      }

      let marketerId: string | null = null;
      let source: "universal_link" | "token" | "fingerprint" = "fingerprint";

      // Method 1: Check for Universal Link / Deep Link with marketerId param
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { marketerId: urlMarketerId, token: urlToken } = extractFromUrl(initialUrl);

          if (urlMarketerId) {
            marketerId = urlMarketerId;
            source = "universal_link";

            // Also resolve the token to record the install server-side
            if (urlToken) {
              await resolveToken(appKey, baseUrl, urlToken, resolveTokenEndpoint);
            }
          } else if (urlToken) {
            // No marketerId in URL but have token - resolve it
            marketerId = await resolveToken(appKey, baseUrl, urlToken, resolveTokenEndpoint);
            if (marketerId) {
              source = "token";
            }
          }
        }
      } catch (error) {
        console.log("No initial URL or parse error:", error);
      }

      // Method 2: Check Android Install Referrer for deferred token
      if (!marketerId && Platform.OS === "android") {
        try {
          const referrerToken = await getAndroidReferrerToken();
          if (referrerToken) {
            marketerId = await resolveToken(appKey, baseUrl, referrerToken, resolveTokenEndpoint);
            if (marketerId) {
              source = "token";
            }
          }
        } catch (error) {
          console.log("Android referrer error:", error);
        }
      }

      // Method 3: Check clipboard for deferred token (iOS only)
      if (!marketerId && Platform.OS === "ios") {
        try {
          const clipboardToken = await getClipboardToken();
          if (clipboardToken) {
            marketerId = await resolveToken(appKey, baseUrl, clipboardToken, resolveTokenEndpoint);
            if (marketerId) {
              source = "token";
              // Clear clipboard after successful resolution
              await clearClipboard();
            }
          }
        } catch (error) {
          console.log("Clipboard read error:", error);
        }
      }

      // Method 4: Fallback to fingerprint-based resolution
      if (!marketerId) {
        try {
          const deviceInfo = await getDeviceInfo();
          marketerId = await resolveMarketerId({
            appKey,
            baseUrl,
            deviceModel: deviceInfo.deviceModel,
            osVersion: deviceInfo.osVersion,
            platform: deviceInfo.platform,
            locale: deviceInfo.locale,
            userAgent: deviceInfo.userAgent,
            endpoint: resolveEndpoint,
          });
          if (marketerId) {
            source = "fingerprint";
          }
        } catch (error) {
          console.error("Failed to resolve marketer ID via fingerprint", error);
        }
      }

      if (!marketerId) {
        await AsyncStorage.setItem(resolvedFlagKey, "1");
        return;
      }

      if (dedupe && (await hasTracked(marketerId))) return;

      if (dedupe) {
        await markTracked(marketerId);
      }
      if (marketerStorageKey) {
        await AsyncStorage.setItem(marketerStorageKey, marketerId);
      }
      await AsyncStorage.setItem(resolvedFlagKey, "1");

      if (syncRevenueCat && Platform.OS !== "web") {
        try {
          console.log("Syncing marketer ID to RevenueCat", marketerId);
          const Purchases = require("react-native-purchases").default;
          Purchases.setAttributes({ [revenueCatAttributeKey]: marketerId });
        } catch {
          // Ignore if RevenueCat isn't configured yet.
        }
      }

      onTracked?.({ ok: true, marketerId, source });
    };

    void resolveAttribution();

    return () => {
      isActive = false;
    };
  }, [
    appKey,
    baseUrl,
    resolveEndpoint,
    resolveTokenEndpoint,
    enabled,
    marketerStorageKey,
    dedupe,
    syncRevenueCat,
    revenueCatAttributeKey,
    onTracked,
  ]);

  return null;
}
