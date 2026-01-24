import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@16.2.0?target=deno";

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

type ClickRow = {
  projectId: string;
  marketerId: string;
  deviceId: string;
  createdAt: string;
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

function getDateKeyFromUnix(seconds: number) {
  return getDateKey(new Date(seconds * 1000).toISOString());
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("PLATFORM_STRIPE_SECRET_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response("Missing Supabase env vars.", { status: 500 });
  }
  if (!stripeSecretKey) {
    return new Response("Missing Stripe secret key.", { status: 500 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "30");
  const lookbackDays = Number.isFinite(days) && days > 0 ? days : 30;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);
  const sinceUnix = Math.floor(since.getTime() / 1000);
  const nowUnix = Math.floor(Date.now() / 1000);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  const { data: projects, error: projectsError } = await supabase
    .from("Project")
    .select("id,creatorStripeAccountId");

  if (projectsError) {
    return new Response(projectsError.message, { status: 500 });
  }

  const totalRevenueByProjectDate = new Map<string, number>();
  for (const project of projects ?? []) {
    if (!project.creatorStripeAccountId) {
      continue;
    }
    let startingAfter: string | undefined = undefined;
    while (true) {
      const charges = await stripe.charges.list(
        {
          limit: 100,
          starting_after: startingAfter,
        },
        { stripeAccount: project.creatorStripeAccountId },
      );

      charges.data.forEach((charge) => {
        if (!charge.paid || charge.refunded) return;
        if (charge.created < sinceUnix || charge.created > nowUnix) return;
        const dateKey = getDateKeyFromUnix(charge.created);
        const key = `${project.id}:${dateKey}`;
        const current = totalRevenueByProjectDate.get(key) ?? 0;
        totalRevenueByProjectDate.set(key, current + (charge.amount ?? 0));
      });

      if (!charges.has_more) break;
      startingAfter = charges.data.at(-1)?.id;
      if (!startingAfter) break;
    }
  }

  const { data, error } = await supabase
    .from("Purchase")
    .select(
      "projectId,amount,commissionAmount,couponId,marketerId,customerEmail,createdAt,coupon:Coupon(marketerId)",
    )
    .not("commissionStatus", "in", '("REFUNDED","CHARGEBACK")')
    .gte("createdAt", since.toISOString());

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const { data: clickData, error: clickError } = await supabase
    .from("AttributionClick")
    .select("projectId,marketerId,deviceId,createdAt")
    .gte("createdAt", since.toISOString());

  if (clickError) {
    return new Response(clickError.message, { status: 500 });
  }

  const rows = (data ?? []) as PurchaseRow[];
  const snapshotMap = new Map<string, SnapshotTotals>();

  (clickData ?? []).forEach((row) => {
    const click = row as ClickRow;
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

  const upserts = Array.from(snapshotMap.entries()).map(([key, totals]) => {
    const [projectId, marketerId, dateKey] = key.split(":");
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const now = new Date();
    const projectRevenueDay =
      totalRevenueByProjectDate.get(`${projectId}:${dateKey}`) ?? 0;
    return {
      projectId,
      marketerId,
      date,
      projectRevenueDay,
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
    return new Response(JSON.stringify({ ok: true, count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: upsertError } = await supabase
    .from("MarketerMetricsSnapshot")
    .upsert(upserts, { onConflict: "projectId,marketerId,date" });

  if (upsertError) {
    return new Response(upsertError.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, count: upserts.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
