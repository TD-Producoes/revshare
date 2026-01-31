import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function generateToken() {
  return crypto.randomBytes(16).toString("base64url");
}

function detectPlatform(userAgent: string) {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

// iOS: Show button page for clipboard copy
function generateiOSDeepLinkHTML(options: {
  token: string;
  appStoreUrl: string | null;
  appName?: string;
}) {
  const { token, appStoreUrl, appName = "the app" } = options;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${appName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #fff;
    }
    .c { text-align: center; padding: 20px; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
    p { color: #888; font-size: 14px; margin: 0 0 24px; }
    button {
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 500;
      color: #fff;
      background: #000;
      border: none;
      border-radius: 10px;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; }
  </style>
</head>
<body>
  <div class="c">
    <h1>${appName}</h1>
    <p>Tap to continue to App Store</p>
    <button id="btn">Continue</button>
  </div>
  <script>
    document.getElementById("btn").onclick = async function() {
      this.disabled = true;
      this.textContent = "Redirecting...";
      try {
        await navigator.clipboard.writeText("${token}");
      } catch(e) {
        var i = document.createElement("input");
        i.value = "${token}";
        i.style.cssText = "position:absolute;left:-9999px";
        document.body.appendChild(i);
        i.select();
        document.execCommand("copy");
        document.body.removeChild(i);
      }
      if ("${appStoreUrl || ""}") location.href = "${appStoreUrl || ""}";
    };
  </script>
</body>
</html>`;
}

// Android: Build Play Store URL with referrer parameter for Install Referrer API
function buildAndroidStoreUrl(playStoreUrl: string, token: string): string {
  const url = new URL(playStoreUrl);
  url.searchParams.set("referrer", `token=${token}`);
  return url.toString();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const record = await prisma.attributionShortLink.findUnique({
    where: { code },
    select: {
      projectId: true,
      marketerId: true,
      project: {
        select: {
          name: true,
          appStoreUrl: true,
          playStoreUrl: true,
        },
      },
    },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Attribution link not found" },
      { status: 404 }
    );
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const platform = detectPlatform(userAgent);

  // Generate and store deferred token
  const token = generateToken();
  await prisma.attributionDeferredToken.create({
    data: {
      token,
      projectId: record.projectId,
      marketerId: record.marketerId,
    },
  });

  // Also create fingerprint for fallback matching (legacy support)
  const origin = new URL(request.url).origin;
  const installUrl = `${origin}/api/attribution/install?projectId=${record.projectId}&marketerId=${record.marketerId}`;

  // Also trigger fingerprint recording in background
  fetch(installUrl, { headers: request.headers }).catch(() => {});

  // Android: Redirect immediately to Play Store with referrer param (no clipboard needed)
  if (platform === "android" && record.project.playStoreUrl) {
    const storeUrl = buildAndroidStoreUrl(record.project.playStoreUrl, token);
    return NextResponse.redirect(storeUrl);
  }

  // iOS: Show button page for clipboard copy
  if (platform === "ios") {
    const html = generateiOSDeepLinkHTML({
      token,
      appStoreUrl: record.project.appStoreUrl,
      appName: record.project.name,
    });
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Desktop/other: redirect to install endpoint
  return NextResponse.redirect(installUrl);
}
