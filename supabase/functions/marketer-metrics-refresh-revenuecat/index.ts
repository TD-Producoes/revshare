import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type PurchaseRow = {
  projectId: string;
  amount: number;
  commissionAmount: number;
  couponId: string | null;
  marketerId: string | null;
  customerEmail: string | null;
  createdAt: string;
  coupon: { marketerId: string | null } | null;
};

type ProjectIntegrationRow = {
  projectId: string;
  externalId: string | null;
};

type SnapshotTotals = {
  affiliateRevenueDay: number;
  commissionOwedDay: number;
  purchasesCountDay: number;
  customerEmailsDay: Set<string>;
  clicksCountDay: number;
  installsCountDay: number;
};

function createEmptySnapshotTotals(): SnapshotTotals {
  return {
    affiliateRevenueDay: 0,
    commissionOwedDay: 0,
    purchasesCountDay: 0,
    customerEmailsDay: new Set<string>(),
    clicksCountDay: 0,
    installsCountDay: 0,
  };
}

function getDateKey(value: string) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    .select("projectId,externalId")
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

  const skipped: Array<{ projectId: string; reason: string }> = [];

  for (const integration of projectIntegrations) {
    if (!integration.externalId) {
      skipped.push({
        projectId: integration.projectId,
        reason: "missing_revenuecat_project_id",
      });
    }
  }

  const { data, error } = await supabase
    .from("Purchase")
    .select(
      "projectId,amount,commissionAmount,couponId,marketerId,customerEmail,createdAt,coupon:Coupon(marketerId)",
    )
    .not("commissionStatus", "in", '("REFUNDED","CHARGEBACK")')
    .in("projectId", projectIds)
    .gte("createdAt", since.toISOString());

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const { data: clickData, error: clickError } = await supabase
    .from("AttributionClick")
    .select("projectId,marketerId,deviceId,createdAt")
    .in("projectId", projectIds)
    .gte("createdAt", since.toISOString());

  if (clickError) {
    return new Response(clickError.message, { status: 500 });
  }

  const rows = (data ?? []) as PurchaseRow[];
  const snapshotMap = new Map<string, SnapshotTotals>();

  (clickData ?? []).forEach((row) => {
    const click = row as {
      projectId: string;
      marketerId: string;
      deviceId: string;
      createdAt: string;
    };
    if (!click.projectId || !click.marketerId) return;
    const dateKey = getDateKey(click.createdAt);
    const key = `${click.projectId}:${click.marketerId}:${dateKey}`;
    const existing = snapshotMap.get(key) ?? createEmptySnapshotTotals();
    if (click.deviceId?.startsWith("install:")) {
      existing.installsCountDay += 1;
    } else {
      existing.clicksCountDay += 1;
    }
    snapshotMap.set(key, existing);
  });

  rows.forEach((row) => {
    const marketerId = row.coupon?.marketerId ?? row.marketerId;
    if (!row.projectId || !marketerId) return;
    const dateKey = getDateKey(row.createdAt);
    const key = `${row.projectId}:${marketerId}:${dateKey}`;
    const existing = snapshotMap.get(key) ?? createEmptySnapshotTotals();

    existing.affiliateRevenueDay += Number(row.amount) || 0;
    existing.commissionOwedDay += Number(row.commissionAmount) || 0;
    existing.purchasesCountDay += 1;
    if (row.customerEmail) {
      existing.customerEmailsDay.add(row.customerEmail.toLowerCase());
    }

    snapshotMap.set(key, existing);
  });

  const now = new Date();
  const upserts = Array.from(snapshotMap.entries()).map(([key, totals]) => {
    const [projectId, marketerId, dateKey] = key.split(":");
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    return {
      projectId,
      marketerId,
      date,
      affiliateRevenueDay: totals.affiliateRevenueDay,
      commissionOwedDay: totals.commissionOwedDay,
      purchasesCountDay: totals.purchasesCountDay,
      customersCountDay: totals.customerEmailsDay.size,
      clicksCountDay: totals.clicksCountDay,
      installsCountDay: totals.installsCountDay,
      updatedAt: now,
    };
  });

  if (upserts.length === 0) {
    return new Response(JSON.stringify({ ok: true, count: 0, skipped }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: upsertError } = await supabase
    .from("MarketerMetricsSnapshot")
    .upsert(upserts, { onConflict: "projectId,marketerId,date" });

  if (upsertError) {
    return new Response(upsertError.message, { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, count: upserts.length, skipped }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
