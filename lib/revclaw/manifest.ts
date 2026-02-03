import { assertHostnameResolvesToPublicIps, assertPublicHttpUrl } from "@/lib/revclaw/ssrf";

export const MAX_MANIFEST_BYTES = 64 * 1024; // 64KB

const ALLOWED_CONTENT_TYPES = [
  "text/markdown",
  "text/plain",
  "text/x-markdown",
];

function isAllowedContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const [mime] = contentType.split(";").map((p) => p.trim().toLowerCase());
  if (ALLOWED_CONTENT_TYPES.includes(mime)) return true;

  // Be permissive for text/*, but still require it to be text.
  if (mime.startsWith("text/")) return true;

  return false;
}

export async function fetchManifestMarkdown(manifestUrlRaw: string): Promise<{ markdown: string; manifestUrl: string }> {
  const url = assertPublicHttpUrl(manifestUrlRaw);
  await assertHostnameResolvesToPublicIps(url.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual", // disallow redirects (prevents redirect-to-private)
      signal: controller.signal,
      headers: {
        "User-Agent": "RevClaw/1.0 (+https://revshare.example)",
        Accept: "text/markdown,text/plain;q=0.9,text/*;q=0.8,*/*;q=0.1",
      },
    });

    // Block redirects outright.
    if (res.status >= 300 && res.status < 400) {
      throw new Error("manifest_url redirects are not allowed");
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch manifest_url (status ${res.status})`);
    }

    const contentType = res.headers.get("content-type");
    if (!isAllowedContentType(contentType)) {
      throw new Error("manifest_url content-type is not allowed");
    }

    const contentLengthHeader = res.headers.get("content-length");
    if (contentLengthHeader) {
      const n = Number(contentLengthHeader);
      if (Number.isFinite(n) && n > MAX_MANIFEST_BYTES) {
        throw new Error("manifest_url content too large");
      }
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("manifest_url response has no body");
    }

    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_MANIFEST_BYTES) {
          throw new Error("manifest_url content too large");
        }
        chunks.push(value);
      }
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const markdown = buffer.toString("utf8").trim();
    if (!markdown) {
      throw new Error("manifest is empty");
    }

    return { markdown, manifestUrl: url.toString() };
  } finally {
    clearTimeout(timeout);
  }
}
