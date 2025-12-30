import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@16.2.0?target=deno";

type PurchaseRow = {
  amount: number;
  commissionAmount: number;
  couponId: string | null;
  customerEmail: string | null;
  createdAt: string;
  project: {
    userId: string;
    platformCommissionPercent: string | number | null;
  } | null;
};

type SnapshotTotals = {
  totalRevenue: number;
  affiliateRevenue: number;
  affiliateShareOwed: number;
  platformFee: number;
  purchasesCount: number;
  affiliatePurchasesCount: number;
  directPurchasesCount: number;
  customerEmails: Set<string>;
  mrr: number;
};

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

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  const { data: creators, error: creatorsError } = await supabase
    .from("User")
    .select("id,stripeConnectedAccountId")
    .eq("role", "creator");

  if (creatorsError) {
    return new Response(creatorsError.message, { status: 500 });
  }

  const mrrByCreator = new Map<string, number>();
  for (const creator of creators ?? []) {
    if (!creator.stripeConnectedAccountId) {
      mrrByCreator.set(creator.id, 0);
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
        { stripeAccount: creator.stripeConnectedAccountId },
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

    mrrByCreator.set(creator.id, total);
  }

  const { data, error } = await supabase
    .from("Purchase")
    .select(
      "amount,commissionAmount,couponId,customerEmail,createdAt,project:Project(userId,platformCommissionPercent)",
    )
    .gte("createdAt", since.toISOString());

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []) as PurchaseRow[];
  const snapshotMap = new Map<string, SnapshotTotals>();

  rows.forEach((row) => {
    if (!row.project?.userId) {
      return;
    }
    const dateKey = getDateKey(row.createdAt);
    const key = `${row.project.userId}:${dateKey}`;
    const existing =
      snapshotMap.get(key) ?? {
        totalRevenue: 0,
        affiliateRevenue: 0,
        affiliateShareOwed: 0,
        platformFee: 0,
        purchasesCount: 0,
        affiliatePurchasesCount: 0,
        directPurchasesCount: 0,
        customerEmails: new Set<string>(),
        mrr: 0,
      };

    const commissionAmount = Number(row.commissionAmount) || 0;
    const platformPercent = Number(row.project.platformCommissionPercent) || 0;
    existing.totalRevenue += Number(row.amount) || 0;
    if (row.couponId) {
      existing.affiliateRevenue += Number(row.amount) || 0;
      existing.affiliatePurchasesCount += 1;
    } else {
      existing.directPurchasesCount += 1;
    }
    existing.affiliateShareOwed += commissionAmount;
    existing.platformFee += Math.round(commissionAmount * platformPercent);
    existing.purchasesCount += 1;
    if (row.customerEmail) {
      existing.customerEmails.add(row.customerEmail.toLowerCase());
    }

    snapshotMap.set(key, existing);
  });

  const upserts = Array.from(snapshotMap.entries()).map(([key, totals]) => {
    const [creatorId, dateKey] = key.split(":");
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const mrr = mrrByCreator.get(creatorId) ?? 0;
    return {
      creatorId,
      date,
      totalRevenue: totals.totalRevenue,
      affiliateRevenue: totals.affiliateRevenue,
      affiliateShareOwed: totals.affiliateShareOwed,
      platformFee: totals.platformFee,
      mrr,
      purchasesCount: totals.purchasesCount,
      affiliatePurchasesCount: totals.affiliatePurchasesCount,
      directPurchasesCount: totals.directPurchasesCount,
      uniqueCustomers: totals.customerEmails.size,
    };
  });

  if (upserts.length === 0) {
    return new Response(JSON.stringify({ ok: true, count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: upsertError } = await supabase
    .from("MetricsSnapshot")
    .upsert(upserts, { onConflict: "creatorId,date" });

  if (upsertError) {
    return new Response(upsertError.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, count: upserts.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
