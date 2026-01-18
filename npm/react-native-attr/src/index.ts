import { useEffect } from "react";
import { Linking } from "react-native";
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
  dedupe?: boolean;
  onTracked?: (result: { ok: boolean; marketerId: string }) => void;
};

const DEFAULT_ENDPOINT = "/api/attribution/click";
const DEFAULT_MARKETER_PARAM = "marketerId";
const DEFAULT_DEVICE_STORAGE_KEY = "@marketplace/attribution/device-id";

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
  return response.json().catch(() => null);
}

export function AttributionTracker(config: AttributionConfig) {
  const {
    appKey,
    baseUrl,
    marketerParam = DEFAULT_MARKETER_PARAM,
    endpoint = DEFAULT_ENDPOINT,
    enabled = true,
    deviceStorageKey = DEFAULT_DEVICE_STORAGE_KEY,
    dedupe = true,
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
      try {
        await trackClick({
          appKey,
          baseUrl,
          marketerId,
          deviceId,
          url,
          endpoint,
        });
        if (dedupe) {
          await markTracked(marketerId);
        }
        onTracked?.({ ok: true, marketerId });
      } catch {
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
    dedupe,
    onTracked,
  ]);

  return null;
}
