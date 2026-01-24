import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type PurchaseRow = {
  projectId: string;
  amount: number;
  commissionAmount: number;
  couponId: string | null;
  marketerId: string | null;
  customerEmail: string | null;
  createdAt: string;
  project: {
    platformCommissionPercent: string | number | null;
  } | null;
};

type ProjectIntegrationRow = {
  projectId: string;
  externalId: string | null;
  apiKeyCipherText: string;
  apiKeyIv: string;
  apiKeyTag: string;
};

type OverviewMetric = {
  id?: string;
  value?: number | string;
};

type OverviewResponse = {
  metrics?: OverviewMetric[];
};

type SnapshotTotals = {
  totalRevenueDay: number;
  affiliateRevenueDay: number;
  affiliateShareOwedDay: number;
  platformFeeDay: number;
  mrrDay: number;
  purchasesCountDay: number;
  affiliatePurchasesCountDay: number;
  directPurchasesCountDay: number;
  customerEmailsDay: Set<string>;
  affiliateCustomerEmailsDay: Set<string>;
};

type ProjectTotals = {
  totalRevenue: number;
  affiliateRevenue: number;
  affiliateShareOwed: number;
  platformFee: number;
  mrr: number;
  purchasesCount: number;
  affiliatePurchasesCount: number;
  directPurchasesCount: number;
  customerEmails: Set<string>;
  affiliateCustomerEmails: Set<string>;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function createEmptyTotals(): ProjectTotals {
  return {
    totalRevenue: 0,
    affiliateRevenue: 0,
    affiliateShareOwed: 0,
    platformFee: 0,
    mrr: 0,
    purchasesCount: 0,
    affiliatePurchasesCount: 0,
    directPurchasesCount: 0,
    customerEmails: new Set<string>(),
    affiliateCustomerEmails: new Set<string>(),
  };
}

function createEmptySnapshotTotals(): SnapshotTotals {
  return {
    totalRevenueDay: 0,
    affiliateRevenueDay: 0,
    affiliateShareOwedDay: 0,
    platformFeeDay: 0,
    mrrDay: 0,
    purchasesCountDay: 0,
    affiliatePurchasesCountDay: 0,
    directPurchasesCountDay: 0,
    customerEmailsDay: new Set<string>(),
    affiliateCustomerEmailsDay: new Set<string>(),
  };
}

function getDateKey(value: string) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

let cachedKey: CryptoKey | null = null;
async function getEncryptionKey() {
  if (cachedKey) return cachedKey;
  const secret = Deno.env.get("KEY_ENCRYPTION_SECRET");
  if (!secret) {
    throw new Error("Missing KEY_ENCRYPTION_SECRET.");
  }
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  cachedKey = await crypto.subtle.importKey(
    "raw",
    hash,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  return cachedKey;
}

async function decryptSecret(cipherText: string, iv: string, tag: string) {
  const key = await getEncryptionKey();
  const ivBytes = base64ToBytes(iv);
  const cipherBytes = base64ToBytes(cipherText);
  const tagBytes = base64ToBytes(tag);
  const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
  combined.set(cipherBytes, 0);
  combined.set(tagBytes, cipherBytes.length);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes, tagLength: 128 },
    key,
    combined,
  );
  return decoder.decode(decrypted);
}

function buildOverviewUrl(params: {
  baseUrl: string;
  projectExternalId: string;
}) {
  const template =
    Deno.env.get("REVENUECAT_OVERVIEW_PATH") ??
    "/projects/{projectId}/metrics/overview";
  const path = template.replace("{projectId}", params.projectExternalId);
  const url = new URL(`${params.baseUrl}${path}`);
  const currency = Deno.env.get("REVENUECAT_CURRENCY");
  if (currency) {
    url.searchParams.set("currency", currency);
  }
  return url;
}

async function fetchRevenueCatOverview(params: {
  apiKey: string;
  projectExternalId: string;
}) {
  const baseUrl =
    Deno.env.get("REVENUECAT_API_BASE") ?? "https://api.revenuecat.com/v2";
  const url = buildOverviewUrl({
    baseUrl,
    projectExternalId: params.projectExternalId,
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`RevenueCat API error (${response.status}): ${message}`);
  }

  return (await response.json()) as OverviewResponse;
}

function getOverviewMetricValue(
  metrics: OverviewMetric[],
  id: string,
): number {
  const metric = metrics.find((item) => item.id === id);
  const value = metric?.value ?? 0;
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response("Missing Supabase env vars.", { status: 500 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "30");
  const lookbackDays = Number.isFinite(days) && days > 0 ? days : 30;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { data: integrations, error: integrationsError } = await supabase
    .from("ProjectIntegration")
    .select("projectId,externalId,apiKeyCipherText,apiKeyIv,apiKeyTag")
    .eq("provider", "REVENUECAT");

  if (integrationsError) {
    return new Response(integrationsError.message, { status: 500 });
  }

  const projectIntegrations = (integrations ??
    []) as ProjectIntegrationRow[];
  const projectIds = projectIntegrations
    .map((integration) => integration.projectId)
    .filter(Boolean);

  if (projectIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const mrrByProject = new Map<string, number>();
  const revenueByProject = new Map<string, number>();
  const customersByProject = new Map<string, number>();
  const skipped: Array<{ projectId: string; reason: string; error?: string }> =
    [];

  for (const integration of projectIntegrations) {
    if (!integration.externalId) {
      skipped.push({
        projectId: integration.projectId,
        reason: "missing_revenuecat_project_id",
      });
      continue;
    }
    let apiKey: string;
    try {
      apiKey = await decryptSecret(
        integration.apiKeyCipherText,
        integration.apiKeyIv,
        integration.apiKeyTag,
      );
    } catch (error) {
      console.error("Failed to decrypt RevenueCat API key", error);
      skipped.push({
        projectId: integration.projectId,
        reason: "decrypt_failed",
      });
      continue;
    }

    try {
      const overview = await fetchRevenueCatOverview({
        apiKey,
        projectExternalId: integration.externalId,
      });
      const metrics = overview.metrics ?? [];
      const mrr = Math.round(getOverviewMetricValue(metrics, "mrr") * 100);
      const revenue = Math.round(
        getOverviewMetricValue(metrics, "revenue") * 100,
      );
      const activeUsers = getOverviewMetricValue(metrics, "active_users");
      const activeSubscriptions = getOverviewMetricValue(
        metrics,
        "active_subscriptions",
      );
      const newCustomers = getOverviewMetricValue(metrics, "new_customers");
      const customers =
        activeUsers || activeSubscriptions || newCustomers || 0;
      mrrByProject.set(integration.projectId, mrr);
      revenueByProject.set(integration.projectId, revenue);
      customersByProject.set(integration.projectId, Math.round(customers));
    } catch (error) {
      console.error("Failed to fetch RevenueCat overview metrics", error);
      skipped.push({
        projectId: integration.projectId,
        reason: "revenuecat_overview_failed",
        error: (error as Error).message,
      });
      continue;
    }
  }

  const { data: totalData, error: totalError } = await supabase
    .from("Purchase")
    .select(
      "projectId,amount,commissionAmount,couponId,marketerId,customerEmail,project:Project(platformCommissionPercent)",
    )
    .not("commissionStatus", "in", '("REFUNDED","CHARGEBACK")')
    .in("projectId", projectIds);

  if (totalError) {
    return new Response(totalError.message, { status: 500 });
  }

  const totalsByProject = new Map<string, ProjectTotals>();
  for (const row of (totalData ?? []) as PurchaseRow[]) {
    if (!row.projectId) continue;
    const totals = totalsByProject.get(row.projectId) ?? createEmptyTotals();
    totals.purchasesCount += 1;
    const commissionAmount = Number(row.commissionAmount) || 0;
    const platformPercent = Number(row.project?.platformCommissionPercent) || 0;
    if (row.couponId || row.marketerId) {
      totals.affiliatePurchasesCount += 1;
      totals.affiliateRevenue += Number(row.amount) || 0;
      if (row.customerEmail) {
        totals.affiliateCustomerEmails.add(row.customerEmail.toLowerCase());
      }
    } else {
      totals.directPurchasesCount += 1;
    }
    totals.affiliateShareOwed += commissionAmount;
    totals.platformFee += Math.round(commissionAmount * platformPercent);
    if (row.customerEmail) {
      totals.customerEmails.add(row.customerEmail.toLowerCase());
    }
    totalsByProject.set(row.projectId, totals);
  }

  const { data, error } = await supabase
    .from("Purchase")
    .select(
      "projectId,amount,commissionAmount,couponId,marketerId,customerEmail,createdAt,project:Project(platformCommissionPercent)",
    )
    .not("commissionStatus", "in", '("REFUNDED","CHARGEBACK")')
    .in("projectId", projectIds)
    .gte("createdAt", since.toISOString());

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []) as PurchaseRow[];
  const snapshotMap = new Map<string, SnapshotTotals>();

  rows.forEach((row) => {
    if (!row.projectId) {
      return;
    }
    const dateKey = getDateKey(row.createdAt);
    const key = `${row.projectId}:${dateKey}`;
    const existing = snapshotMap.get(key) ?? createEmptySnapshotTotals();

    existing.totalRevenueDay += Number(row.amount) || 0;
    const commissionAmount = Number(row.commissionAmount) || 0;
    const platformPercent = Number(row.project?.platformCommissionPercent) || 0;
    if (row.couponId || row.marketerId) {
      existing.affiliateRevenueDay += Number(row.amount) || 0;
      existing.affiliatePurchasesCountDay += 1;
      if (row.customerEmail) {
        existing.affiliateCustomerEmailsDay.add(row.customerEmail.toLowerCase());
      }
    } else {
      existing.directPurchasesCountDay += 1;
    }
    existing.affiliateShareOwedDay += commissionAmount;
    existing.platformFeeDay += Math.round(commissionAmount * platformPercent);
    existing.purchasesCountDay += 1;
    if (row.customerEmail) {
      existing.customerEmailsDay.add(row.customerEmail.toLowerCase());
    }

    snapshotMap.set(key, existing);
  });

  const now = new Date();
  const todayKey = getDateKey(now.toISOString());

  // Past days: only upsert daily metrics (cumulative values are unknown for past dates)
  const pastUpserts: Record<string, unknown>[] = [];
  // Today: upsert both daily and cumulative metrics (cumulative values are accurate now)
  const todayUpserts: Record<string, unknown>[] = [];
  const projectsWithToday = new Set<string>();

  for (const [key, totals] of snapshotMap.entries()) {
    const [projectId, dateKey] = key.split(":");
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const mrr = mrrByProject.get(projectId) ?? 0;

    if (dateKey === todayKey) {
      projectsWithToday.add(projectId);
      const revenue = revenueByProject.get(projectId) ?? 0;
      const customers = customersByProject.get(projectId) ?? 0;
      const aggregateTotals =
        totalsByProject.get(projectId) ?? createEmptyTotals();
      aggregateTotals.mrr = mrr;
      todayUpserts.push({
        projectId,
        date,
        totalRevenue: revenue,
        affiliateRevenue: aggregateTotals.affiliateRevenue,
        affiliateShareOwed: aggregateTotals.affiliateShareOwed,
        platformFee: aggregateTotals.platformFee,
        mrr: aggregateTotals.mrr,
        purchasesCount: aggregateTotals.purchasesCount,
        affiliatePurchasesCount: aggregateTotals.affiliatePurchasesCount,
        directPurchasesCount: aggregateTotals.directPurchasesCount,
        uniqueCustomers: customers,
        affiliateCustomers: aggregateTotals.affiliateCustomerEmails.size,
        totalRevenueDay: totals.totalRevenueDay,
        affiliateRevenueDay: totals.affiliateRevenueDay,
        affiliateShareOwedDay: totals.affiliateShareOwedDay,
        platformFeeDay: totals.platformFeeDay,
        mrrDay: mrr,
        purchasesCountDay: totals.purchasesCountDay,
        affiliatePurchasesCountDay: totals.affiliatePurchasesCountDay,
        directPurchasesCountDay: totals.directPurchasesCountDay,
        uniqueCustomersDay: totals.customerEmailsDay.size,
        affiliateCustomersDay: totals.affiliateCustomerEmailsDay.size,
        updatedAt: now,
      });
    } else {
      pastUpserts.push({
        projectId,
        date,
        totalRevenueDay: totals.totalRevenueDay,
        affiliateRevenueDay: totals.affiliateRevenueDay,
        affiliateShareOwedDay: totals.affiliateShareOwedDay,
        platformFeeDay: totals.platformFeeDay,
        purchasesCountDay: totals.purchasesCountDay,
        affiliatePurchasesCountDay: totals.affiliatePurchasesCountDay,
        directPurchasesCountDay: totals.directPurchasesCountDay,
        uniqueCustomersDay: totals.customerEmailsDay.size,
        affiliateCustomersDay: totals.affiliateCustomerEmailsDay.size,
        updatedAt: now,
      });
    }
  }

  // Ensure every project gets a today row with cumulative metrics even if no purchases today
  for (const projectId of projectIds) {
    if (projectsWithToday.has(projectId)) continue;
    const mrr = mrrByProject.get(projectId) ?? 0;
    const revenue = revenueByProject.get(projectId) ?? 0;
    const customers = customersByProject.get(projectId) ?? 0;
    const aggregateTotals =
      totalsByProject.get(projectId) ?? createEmptyTotals();
    aggregateTotals.mrr = mrr;
    todayUpserts.push({
      projectId,
      date: new Date(`${todayKey}T00:00:00.000Z`),
      totalRevenue: revenue,
      affiliateRevenue: aggregateTotals.affiliateRevenue,
      affiliateShareOwed: aggregateTotals.affiliateShareOwed,
      platformFee: aggregateTotals.platformFee,
      mrr: aggregateTotals.mrr,
      purchasesCount: aggregateTotals.purchasesCount,
      affiliatePurchasesCount: aggregateTotals.affiliatePurchasesCount,
      directPurchasesCount: aggregateTotals.directPurchasesCount,
      uniqueCustomers: customers,
      affiliateCustomers: aggregateTotals.affiliateCustomerEmails.size,
      totalRevenueDay: 0,
      affiliateRevenueDay: 0,
      affiliateShareOwedDay: 0,
      platformFeeDay: 0,
      mrrDay: mrr,
      purchasesCountDay: 0,
      affiliatePurchasesCountDay: 0,
      directPurchasesCountDay: 0,
      uniqueCustomersDay: 0,
      affiliateCustomersDay: 0,
      updatedAt: now,
    });
  }

  const upserts = [...todayUpserts, ...pastUpserts];

  if (upserts.length === 0) {
    return new Response(JSON.stringify({ ok: true, count: 0, skipped }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Upsert today's rows (full cumulative + daily metrics)
  if (todayUpserts.length > 0) {
    const { error: todayError } = await supabase
      .from("MetricsSnapshot")
      .upsert(todayUpserts, { onConflict: "projectId,date" });
    if (todayError) {
      return new Response(todayError.message, { status: 500 });
    }
  }

  // Upsert past rows (daily metrics only — cumulative fields left unchanged)
  if (pastUpserts.length > 0) {
    const { error: pastError } = await supabase
      .from("MetricsSnapshot")
      .upsert(pastUpserts, { onConflict: "projectId,date" });
    if (pastError) {
      return new Response(pastError.message, { status: 500 });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, count: upserts.length, skipped }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
