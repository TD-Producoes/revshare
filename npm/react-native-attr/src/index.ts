import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TrackClickParams = {
  appKey: string;
  baseUrl: string;
  marketerId: string;
  deviceId: string;
  url?: string;
  endpoint?: string;
};

type ResolveAttributionParams = {
  appKey: string;
  baseUrl: string;
  deviceModel: string;
  osVersion: string;
  platform?: string;
  locale?: string;
  userAgent?: string;
  endpoint?: string;
};

type AttributionConfig = {
  appKey: string;
  baseUrl: string;
  marketerParam?: string;
  endpoint?: string;
  resolveEndpoint?: string;
  enabled?: boolean;
  deviceStorageKey?: string;
  marketerStorageKey?: string;
  dedupe?: boolean;
  syncRevenueCat?: boolean;
  revenueCatAttributeKey?: string;
  onTracked?: (result: { ok: boolean; marketerId: string }) => void;
};

const DEFAULT_ENDPOINT = "/api/attribution/click";
const DEFAULT_RESOLVE_ENDPOINT = "/api/attribution/resolve";
export const MARKETER_ID_STORAGE_KEY = "@marketplace/attribution/marketer-id";

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
  console.log('Syncing marketer ID to RevenueCat', marketerId);
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
  let osVersion = Platform.Version ? String(Platform.Version) : "unknown";
  const platform = Platform.OS;
  let deviceModel = platform;
  let userAgent: string | undefined;

  try {
    const deviceInfo = require("react-native-device-info");
    if (typeof deviceInfo.getModel === "function") {
      deviceModel = deviceInfo.getModel();
    }
    if (typeof deviceInfo.getUserAgent === "function") {
      userAgent = await deviceInfo.getUserAgent();
    }
  } catch {
    // Optional dependency; fall back to platform info.
  }

  if (userAgent && platform === "ios") {
    const match = userAgent.match(/OS ([\d_]+)/i);
    if (match?.[1]) {
      osVersion = match[1].replace(/_/g, ".");
    }
  }

  if (platform === "ios") {
    if (deviceModel.toLowerCase().startsWith("iphone")) {
      deviceModel = "iPhone";
    } else if (deviceModel.toLowerCase().startsWith("ipad")) {
      deviceModel = "iPad";
    }
  }

  return {
    deviceModel,
    osVersion,
    platform,
    locale: getLocale(),
    userAgent,
  };
}

async function resolveMarketerId(params: ResolveAttributionParams) {
  const response = await fetch(
    `${params.baseUrl}${params.endpoint ?? DEFAULT_RESOLVE_ENDPOINT}`,
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
    },
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

export async function trackClick(params: TrackClickParams) {
  console.log('Tracking click with params', `${params.baseUrl}${params.endpoint ?? DEFAULT_ENDPOINT}`);
  const response = await fetch(`${params.baseUrl}${params.endpoint ?? DEFAULT_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appKey: params.appKey,
      marketerId: params.marketerId,
      deviceId: params.deviceId,
      url: params.url,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to track attribution");
  }
  return response.json().catch((e) => 
    { console.error('Failed to parse response json', e); return null; }
  );
}

export function AttributionTracker(config: AttributionConfig) {
  const {
    appKey,
    baseUrl,
    resolveEndpoint = DEFAULT_RESOLVE_ENDPOINT,
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
      const deviceInfo = await getDeviceInfo();
      let marketerId: string | null = null;
      try {
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
      } catch (error) {
        console.error("Failed to resolve marketer ID", error);
      }

      if (!marketerId) return;
      if (dedupe && (await hasTracked(marketerId))) return;

      if (dedupe) {
        await markTracked(marketerId);
      }
      if (marketerStorageKey) {
        await AsyncStorage.setItem(marketerStorageKey, marketerId);
      }
      if (syncRevenueCat && Platform.OS !== "web") {
        try {
          console.log('Syncing marketer ID to RevenueCat', marketerId);
          const Purchases = require("react-native-purchases").default;
          Purchases.setAttributes({ [revenueCatAttributeKey]: marketerId });
        } catch {
          // Ignore if RevenueCat isn't configured yet.
        }
      }
      onTracked?.({ ok: true, marketerId });
    };

    void resolveAttribution();

    return () => {
      isActive = false;
    };
  }, [
    appKey,
    baseUrl,
    resolveEndpoint,
    enabled,
    marketerStorageKey,
    dedupe,
    syncRevenueCat,
    revenueCatAttributeKey,
    onTracked,
  ]);

  return null;
}
