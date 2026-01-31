# Plan: Replace Fingerprint Attribution with Universal Links

## Current Problem
Fingerprint-based attribution relies on matching device characteristics (IP, device model, OS version) between the browser click and the in-app resolve call. This is unreliable because:
- IP can change (WiFi → cellular)
- OS version parsing differs between Safari UA and native APIs
- User agent formats vary between Safari and WebView
- Time delays between click and install can invalidate fingerprints

## Solution: Universal Links + Deferred Deep Linking

Universal Links (iOS) and App Links (Android) pass data directly from the web to the app, eliminating fingerprint matching entirely.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER CLICKS LINK                            │
│                    https://revshare.fast/a/abc123                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APP INSTALLED?                                  │
└─────────────────────────────────────────────────────────────────────┘
          │                                        │
          │ YES                                    │ NO
          ▼                                        ▼
┌─────────────────────┐              ┌─────────────────────────────────┐
│   UNIVERSAL LINK    │              │    DEFERRED DEEP LINK FLOW      │
│   Opens app with    │              │                                 │
│   marketerId param  │              │ 1. Generate unique token        │
│                     │              │ 2. Store token → marketerId     │
│   App extracts:     │              │ 3. Copy token to clipboard      │
│   marketerId=xyz    │              │ 4. Redirect to App Store        │
│                     │              │ 5. User installs app            │
│   ✓ DONE            │              │ 6. App reads clipboard token    │
└─────────────────────┘              │ 7. App resolves token → marketer│
                                     └─────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Backend - Universal Links Configuration

#### 1.1 Create Apple App Site Association (AASA) file

**File:** `public/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourapp.bundleid",
        "paths": ["/a/*"]
      }
    ]
  }
}
```

- Replace `TEAM_ID` with your Apple Developer Team ID
- Replace `com.yourapp.bundleid` with your app's bundle identifier
- The `/a/*` path pattern matches all short links

#### 1.2 Create Android Asset Links file

**File:** `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourapp.package",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

#### 1.3 Configure Next.js to serve AASA correctly

**File:** `next.config.ts` (add headers)

```typescript
async headers() {
  return [
    {
      source: '/.well-known/apple-app-site-association',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
      ],
    },
  ];
}
```

---

### Phase 2: Backend - Deferred Deep Link Token System

#### 2.1 Add Prisma model for deferred tokens

**File:** `prisma/schema.prisma`

```prisma
model AttributionDeferredToken {
  id         String   @id @default(cuid())
  token      String   @unique
  projectId  String
  marketerId String
  createdAt  DateTime @default(now())
  resolvedAt DateTime?

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([projectId])
}
```

#### 2.2 Update short link handler to support deferred deep links

**File:** `app/a/[code]/route.ts`

```typescript
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const record = await prisma.attributionShortLink.findUnique({
    where: { code },
    select: { projectId: true, marketerId: true, project: { select: { appStoreUrl: true, playStoreUrl: true } } },
  });

  if (!record) {
    return NextResponse.json({ error: "Attribution link not found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  // Generate deferred token for clipboard-based attribution
  const token = crypto.randomBytes(16).toString("base64url");

  await prisma.attributionDeferredToken.create({
    data: {
      token,
      projectId: record.projectId,
      marketerId: record.marketerId,
    },
  });

  // Build Universal Link URL that includes marketerId
  const appUrl = `yourapp://attribution?marketerId=${record.marketerId}&token=${token}`;

  // Return HTML page that:
  // 1. Tries to open Universal Link
  // 2. Copies token to clipboard
  // 3. Falls back to App Store
  return new Response(
    generateDeferredDeepLinkHTML({
      appUrl,
      token,
      marketerId: record.marketerId,
      appStoreUrl: record.project.appStoreUrl,
      playStoreUrl: record.project.playStoreUrl,
      isIOS,
      isAndroid,
    }),
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}

function generateDeferredDeepLinkHTML(options: {
  appUrl: string;
  token: string;
  marketerId: string;
  appStoreUrl: string | null;
  playStoreUrl: string | null;
  isIOS: boolean;
  isAndroid: boolean;
}) {
  const storeUrl = options.isIOS ? options.appStoreUrl : options.playStoreUrl;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening App...</title>
</head>
<body>
  <script>
    // Copy token to clipboard for deferred attribution
    const token = "${options.token}";

    async function handleAttribution() {
      // Try to copy token to clipboard
      try {
        await navigator.clipboard.writeText(token);
      } catch (e) {
        // Fallback: store in localStorage (for PWA/web fallback)
        localStorage.setItem('attribution_token', token);
      }

      // Try Universal Link first
      const appUrl = "${options.appUrl}";
      const storeUrl = "${storeUrl || ''}";

      // Try to open app
      window.location.href = appUrl;

      // If app doesn't open in 1.5s, redirect to store
      setTimeout(() => {
        if (storeUrl) {
          window.location.href = storeUrl;
        }
      }, 1500);
    }

    handleAttribution();
  </script>
  <p style="text-align: center; margin-top: 50px;">
    Redirecting to app...
  </p>
</body>
</html>
  `;
}
```

#### 2.3 Create token resolution endpoint

**File:** `app/api/attribution/resolve-token/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const schema = z.object({
  appKey: z.string().min(10),
  token: z.string().min(1),
});

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400, headers: corsHeaders }
    );
  }

  const { appKey, token } = parsed.data;

  // Validate app key
  const keyHash = hashKey(appKey);
  const keyRecord = await prisma.attributionAppKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { projectId: true },
  });

  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid app key" },
      { status: 401, headers: corsHeaders }
    );
  }

  // Find and validate token (within 7 days, not already resolved)
  const tokenRecord = await prisma.attributionDeferredToken.findFirst({
    where: {
      token,
      projectId: keyRecord.projectId,
      resolvedAt: null,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, marketerId: true },
  });

  if (!tokenRecord) {
    return NextResponse.json(
      { ok: true, marketerId: null },
      { headers: corsHeaders }
    );
  }

  // Mark token as resolved
  await prisma.attributionDeferredToken.update({
    where: { id: tokenRecord.id },
    data: { resolvedAt: new Date() },
  });

  // Record the install
  await prisma.attributionClick.upsert({
    where: {
      projectId_marketerId_deviceId: {
        projectId: keyRecord.projectId,
        marketerId: tokenRecord.marketerId,
        deviceId: `install:token:${token}`,
      },
    },
    update: {},
    create: {
      projectId: keyRecord.projectId,
      marketerId: tokenRecord.marketerId,
      deviceId: `install:token:${token}`,
    },
  });

  return NextResponse.json(
    { ok: true, marketerId: tokenRecord.marketerId },
    { headers: corsHeaders }
  );
}
```

---

### Phase 3: React Native App Changes

#### 3.1 Update npm package to handle Universal Links

**File:** `npm/react-native-attr/src/index.ts`

```typescript
import { useEffect } from "react";
import { Platform, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";

// ... existing types ...

type AttributionConfig = {
  appKey: string;
  baseUrl?: string;
  enabled?: boolean;
  marketerStorageKey?: string;
  onTracked?: (result: { ok: boolean; marketerId: string }) => void;
};

const DEFAULT_BASE_URL = "https://revshare.fast";

export function AttributionTracker(config: AttributionConfig) {
  const {
    appKey,
    baseUrl = DEFAULT_BASE_URL,
    enabled = true,
    marketerStorageKey = "@marketplace/attribution/marketer-id",
    onTracked,
  } = config;

  useEffect(() => {
    if (!enabled) return;

    const resolveAttribution = async () => {
      // Check if already resolved
      const existingMarketer = await AsyncStorage.getItem(marketerStorageKey);
      if (existingMarketer) return;

      let marketerId: string | null = null;

      // Method 1: Check for Universal Link with marketerId param
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const url = new URL(initialUrl);
          const urlMarketerId = url.searchParams.get("marketerId");
          const urlToken = url.searchParams.get("token");

          if (urlMarketerId) {
            marketerId = urlMarketerId;

            // Also resolve the token to record the install
            if (urlToken) {
              await resolveToken(appKey, baseUrl, urlToken);
            }
          }
        }
      } catch (e) {
        console.log("No initial URL or parse error:", e);
      }

      // Method 2: Check clipboard for deferred token
      if (!marketerId) {
        try {
          const clipboardContent = await Clipboard.getString();
          if (clipboardContent && clipboardContent.length > 10 && clipboardContent.length < 50) {
            // Looks like a token, try to resolve it
            const result = await resolveToken(appKey, baseUrl, clipboardContent);
            if (result?.marketerId) {
              marketerId = result.marketerId;
              // Clear clipboard after successful resolution
              Clipboard.setString("");
            }
          }
        } catch (e) {
          console.log("Clipboard read error:", e);
        }
      }

      // Method 3: Fallback to fingerprint-based resolution (legacy)
      if (!marketerId) {
        marketerId = await resolveFingerprintBased(appKey, baseUrl);
      }

      // Store result
      if (marketerId) {
        await AsyncStorage.setItem(marketerStorageKey, marketerId);
        onTracked?.({ ok: true, marketerId });
      }
    };

    resolveAttribution();
  }, [appKey, baseUrl, enabled, marketerStorageKey, onTracked]);

  return null;
}

async function resolveToken(
  appKey: string,
  baseUrl: string,
  token: string
): Promise<{ marketerId: string | null } | null> {
  try {
    const response = await fetch(`${baseUrl}/api/attribution/resolve-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appKey, token }),
    });
    return await response.json();
  } catch {
    return null;
  }
}

async function resolveFingerprintBased(
  appKey: string,
  baseUrl: string
): Promise<string | null> {
  // ... existing fingerprint resolution logic ...
  // Keep as fallback for edge cases
}
```

#### 3.2 Add peer dependency for clipboard

**File:** `npm/react-native-attr/package.json`

```json
{
  "peerDependencies": {
    "react": ">=17",
    "react-native": ">=0.70",
    "@react-native-async-storage/async-storage": ">=1.17",
    "@react-native-clipboard/clipboard": ">=1.11.0"
  }
}
```

---

### Phase 4: iOS App Configuration

#### 4.1 Add Associated Domains capability

In Xcode:
1. Select your target → Signing & Capabilities
2. Add "Associated Domains"
3. Add: `applinks:revshare.fast` (your domain)

#### 4.2 Handle Universal Links in AppDelegate

```swift
// AppDelegate.swift or AppDelegate.mm
- (BOOL)application:(UIApplication *)application
    continueUserActivity:(NSUserActivity *)userActivity
    restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {

    if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        NSURL *url = userActivity.webpageURL;
        // React Native's Linking module will handle this
        return [RCTLinkingManager application:application
                         continueUserActivity:userActivity
                           restorationHandler:restorationHandler];
    }
    return NO;
}
```

---

### Phase 5: Android App Configuration

#### 5.1 Add intent filter to AndroidManifest.xml

```xml
<activity android:name=".MainActivity">
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="https"
      android:host="revshare.fast"
      android:pathPrefix="/a/" />
  </intent-filter>
</activity>
```

---

## Migration Strategy

### Step 1: Deploy backend changes
- Add AASA and assetlinks.json files
- Create new `AttributionDeferredToken` model
- Deploy new short link handler and resolve-token endpoint

### Step 2: Update React Native package
- Add Universal Link handling
- Add clipboard token resolution
- Keep fingerprint fallback active

### Step 3: Update native apps
- Add Associated Domains (iOS)
- Add intent filters (Android)
- Install new npm package version

### Step 4: Monitor and deprecate fingerprint
- Track attribution source (universal link vs token vs fingerprint)
- Gradually reduce fingerprint time window
- Eventually deprecate fingerprint resolution

---

## Comparison: Fingerprint vs Universal Links

| Aspect | Fingerprint | Universal Links |
|--------|-------------|-----------------|
| Reliability | ~60-80% match rate | ~95%+ match rate |
| Cross-network | ✗ Fails if IP changes | ✓ Works across networks |
| Time sensitivity | 7-day window | Token valid for 7 days |
| Privacy | Stores device info | Only stores token |
| iOS 14.5+ | Affected by ATT | Not affected |
| Complexity | High (parsing UAs) | Low (direct data passing) |
| Fallback needed | N/A | Yes (for edge cases) |

---

## Files to Create/Modify

### New Files:
1. `public/.well-known/apple-app-site-association`
2. `public/.well-known/assetlinks.json`
3. `app/api/attribution/resolve-token/route.ts`

### Modified Files:
1. `prisma/schema.prisma` (add AttributionDeferredToken)
2. `app/a/[code]/route.ts` (add deferred deep link HTML)
3. `npm/react-native-attr/src/index.ts` (add Universal Link + clipboard handling)
4. `npm/react-native-attr/package.json` (add clipboard peer dependency)
5. `next.config.ts` (add AASA content-type header)

---

## Timeline Estimate

- Phase 1 (Backend config): 2-3 hours
- Phase 2 (Token system): 3-4 hours
- Phase 3 (RN package): 3-4 hours
- Phase 4 (iOS config): 1-2 hours
- Phase 5 (Android config): 1-2 hours
- Testing & debugging: 4-6 hours

**Total: ~2-3 days**
