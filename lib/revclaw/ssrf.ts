import dns from "dns";
import net from "net";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;

  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local + AWS/GCP metadata host)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // loopback
  if (normalized === "::1") return true;
  // link-local fe80::/10
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  // unique local addresses fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  return false;
}

export function assertPublicHttpUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid manifest_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("manifest_url must be http(s)");
  }

  // Avoid common local hostnames without DNS lookup.
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("manifest_url hostname is not allowed");
  }

  // Block literal IPs early.
  const ipType = net.isIP(hostname);
  if (ipType === 4 && isPrivateIPv4(hostname)) {
    throw new Error("manifest_url resolves to a private IP");
  }
  if (ipType === 6 && isPrivateIPv6(hostname)) {
    throw new Error("manifest_url resolves to a private IP");
  }

  return url;
}

export async function assertHostnameResolvesToPublicIps(hostname: string) {
  // Resolve all A/AAAA records.
  const results = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  if (!results.length) {
    throw new Error("manifest_url could not be resolved");
  }

  for (const { address, family } of results) {
    if (family === 4 && isPrivateIPv4(address)) {
      throw new Error("manifest_url resolves to a private IP");
    }
    if (family === 6 && isPrivateIPv6(address)) {
      throw new Error("manifest_url resolves to a private IP");
    }
  }
}
