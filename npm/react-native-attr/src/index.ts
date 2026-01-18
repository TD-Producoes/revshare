import { useEffect } from "react";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TrackClickParams = {
  appKey: string;
  baseUrl: string;
  marketerId: string;
  deviceId: string;
  url?: string;
  endpoint?: string;
};

type AttributionConfig = {
  appKey: string;
  baseUrl: string;
  marketerParam?: string;
  endpoint?: string;
  enabled?: boolean;
  deviceStorageKey?: string;
  marketerStorageKey?: string;
  dedupe?: boolean;
  syncRevenueCat?: boolean;
  revenueCatAttributeKey?: string;
  onTracked?: (result: { ok: boolean; marketerId: string }) => void;
};

const DEFAULT_ENDPOINT = "/api/attribution/click";
const DEFAULT_MARKETER_PARAM = "marketerId";
const DEFAULT_DEVICE_STORAGE_KEY = "@marketplace/attribution/device-id";
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

function createRandomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getDeviceId(storageKey: string) {
  const existing = await AsyncStorage.getItem(storageKey);
  if (existing) return existing;
  const next = createRandomId();
  await AsyncStorage.setItem(storageKey, next);
  return next;
}

function extractMarketerId(url: string, marketerParam: string) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get(marketerParam);
  } catch {
    const query = url.split("?")[1];
    if (!query) return null;
    const pairs = query.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key === marketerParam) {
        return decodeURIComponent(value ?? "");
      }
    }
    return null;
  }
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
    marketerParam = DEFAULT_MARKETER_PARAM,
    endpoint = DEFAULT_ENDPOINT,
    enabled = true,
    deviceStorageKey = DEFAULT_DEVICE_STORAGE_KEY,
    marketerStorageKey = MARKETER_ID_STORAGE_KEY,
    dedupe = true,
    syncRevenueCat = false,
    revenueCatAttributeKey = "marketer_id",
    onTracked,
  } = config;

  useEffect(() => {
    if (!enabled) return;
    let isActive = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !isActive) return;
      const marketerId = extractMarketerId(url, marketerParam);
      if (!marketerId) return;
      if (dedupe && (await hasTracked(marketerId))) return;
      const deviceId = await getDeviceId(deviceStorageKey);
      console.log('Tracking attribution click', { marketerId, deviceId });
      try {
        const res = await trackClick({
          appKey,
          baseUrl,
          marketerId,
          deviceId,
          url,
          endpoint,
        });
        console.log('Attribution tracked successfully', res);
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
      } catch (e) {
        console.error('Failed to track attribution click', e);
        onTracked?.({ ok: false, marketerId });
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => null);
    const subscription = Linking.addEventListener("url", (event) => {
      void handleUrl(event.url);
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [
    appKey,
    baseUrl,
    marketerParam,
    endpoint,
    enabled,
    deviceStorageKey,
    marketerStorageKey,
    dedupe,
    syncRevenueCat,
    revenueCatAttributeKey,
    onTracked,
  ]);

  return null;
}
