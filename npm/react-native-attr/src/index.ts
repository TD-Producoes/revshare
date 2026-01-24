import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";

type TrackClickParams = {
  appKey: string;
  baseUrl?: string;
  marketerId: string;
  deviceId: string;
  url?: string;
  endpoint?: string;
};

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
  enabled?: boolean;
  deviceStorageKey?: string;
  marketerStorageKey?: string;
  dedupe?: boolean;
  syncRevenueCat?: boolean;
  revenueCatAttributeKey?: string;
  onTracked?: (result: { ok: boolean; marketerId: string }) => void;
};

const DEFAULT_RESOLVE_ENDPOINT = "/api/attribution/resolve";
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
  const platform = Platform.OS;
  let osVersion = Device.osVersion ?? (Platform.Version ? String(Platform.Version) : "unknown");
  let deviceModel: string = Device.modelName ?? Device.modelId ?? platform;
  let userAgent: string | undefined;

  if (platform === "web" && typeof navigator !== "undefined") {
    userAgent = navigator.userAgent;
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

export function AttributionTracker(config: AttributionConfig) {
  const {
    appKey,
    baseUrl = BASE_URL,
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
      const resolvedFlagKey = marketerStorageKey
        ? `${marketerStorageKey}/resolved`
        : RESOLVED_FLAG_STORAGE_KEY;
      if (marketerStorageKey) {
        const storedMarketerId = await AsyncStorage.getItem(marketerStorageKey);
        if (storedMarketerId) {
          return;
        }
      }
      if (await AsyncStorage.getItem(resolvedFlagKey)) {
        return;
      }
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
