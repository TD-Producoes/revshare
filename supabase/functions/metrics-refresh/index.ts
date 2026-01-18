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
  project: {
    platformCommissionPercent: string | number | null;
  } | null;
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

  const stripeProjectIds = (projects ?? [])
    .filter((project) => Boolean(project.creatorStripeAccountId))
    .map((project) => project.id);

  if (stripeProjectIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const mrrByProject = new Map<string, number>();
  const totalRevenueByProjectDate = new Map<string, number>();
  const totalRevenueByProject = new Map<string, number>();
  for (const project of projects ?? []) {
    if (!project.creatorStripeAccountId) {
      continue;
    }
    let startingAfter: string | undefined = undefined;
    let total = 0;

    while (true) {
      const subscriptions = await stripe.subscriptions.list(
        {
          status: "active",
          limit: 100,
          starting_after: startingAfter,
        },
        { stripeAccount: project.creatorStripeAccountId },
      );

      subscriptions.data.forEach((subscription) => {
        subscription.items.data.forEach((item) => {
          const price = item.price;
          const unitAmount = price.unit_amount ?? 0;
          const quantity = item.quantity ?? 1;
          if (price.recurring?.interval === "month") {
            total += unitAmount * quantity;
          } else if (price.recurring?.interval === "year") {
            total += Math.round((unitAmount * quantity) / 12);
          }
        });
      });

      if (!subscriptions.has_more) break;
      startingAfter = subscriptions.data.at(-1)?.id;
      if (!startingAfter) break;
    }

    mrrByProject.set(project.id, total);

    let revenueStartingAfter: string | undefined = undefined;
    while (true) {
      const charges = await stripe.charges.list(
        {
          limit: 100,
          starting_after: revenueStartingAfter,
        },
        { stripeAccount: project.creatorStripeAccountId },
      );

      charges.data.forEach((charge) => {
        if (!charge.paid || charge.refunded) return;
        const amount = charge.amount ?? 0;
        totalRevenueByProject.set(
          project.id,
          (totalRevenueByProject.get(project.id) ?? 0) + amount,
        );
        if (charge.created >= sinceUnix && charge.created <= nowUnix) {
          const dateKey = getDateKeyFromUnix(charge.created);
          const key = `${project.id}:${dateKey}`;
          const current = totalRevenueByProjectDate.get(key) ?? 0;
          totalRevenueByProjectDate.set(key, current + amount);
        }
      });

      if (!charges.has_more) break;
      revenueStartingAfter = charges.data.at(-1)?.id;
      if (!revenueStartingAfter) break;
    }
  }

  const { data: totalData, error: totalError } = await supabase
    .from("Purchase")
    .select(
      "projectId,amount,commissionAmount,couponId,marketerId,customerEmail,project:Project(platformCommissionPercent)",
    )
    .in("projectId", stripeProjectIds)
    .not("commissionStatus", "in", '("REFUNDED","CHARGEBACK")');

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
    .in("projectId", stripeProjectIds)
    .gte("createdAt", since.toISOString());

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []) as PurchaseRow[];
  const snapshotMap = new Map<string, SnapshotTotals>();

  totalRevenueByProjectDate.forEach((totalRevenue, key) => {
    const totals = createEmptySnapshotTotals();
    totals.totalRevenueDay = totalRevenue;
    snapshotMap.set(key, totals);
  });

  rows.forEach((row) => {
    if (!row.projectId) {
      return;
    }
    const dateKey = getDateKey(row.createdAt);
    const key = `${row.projectId}:${dateKey}`;
    const existing = snapshotMap.get(key) ?? createEmptySnapshotTotals();

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

  const upserts = Array.from(snapshotMap.entries()).map(([key, totals]) => {
    const [projectId, dateKey] = key.split(":");
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const mrr = mrrByProject.get(projectId) ?? 0;
    const aggregateTotals =
      totalsByProject.get(projectId) ?? createEmptyTotals();
    aggregateTotals.mrr = mrr;
    const now = new Date();
    return {
      projectId,
      date,
      totalRevenue: totalRevenueByProject.get(projectId) ?? 0,
      affiliateRevenue: aggregateTotals.affiliateRevenue,
      affiliateShareOwed: aggregateTotals.affiliateShareOwed,
      platformFee: aggregateTotals.platformFee,
      mrr: aggregateTotals.mrr,
      purchasesCount: aggregateTotals.purchasesCount,
      affiliatePurchasesCount: aggregateTotals.affiliatePurchasesCount,
      directPurchasesCount: aggregateTotals.directPurchasesCount,
      uniqueCustomers: aggregateTotals.customerEmails.size,
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
    };
  });

  if (upserts.length === 0) {
    return new Response(JSON.stringify({ ok: true, count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: upsertError } = await supabase
    .from("MetricsSnapshot")
    .upsert(upserts, { onConflict: "projectId,date" });

  if (upsertError) {
    return new Response(upsertError.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, count: upserts.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
