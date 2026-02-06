import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const rewardUnlockedMessage = (rewardName: string, projectName: string) => ({
  title: "Reward unlocked",
  message: `${rewardName} is now unlocked for ${projectName}.`,
});

const rewardUnlockedCreatorMessage = (
  marketerId: string,
  rewardName: string,
  projectName: string,
) => ({
  title: "Reward earned",
  message: `A marketer earned ${rewardName} for ${projectName}.`,
  data: {
    marketerId,
  },
});

type RewardRow = {
  id: string;
  projectId: string;
  name: string;
  startsAt: string | null;
  createdAt: string;
  milestoneType: "NET_REVENUE" | "COMPLETED_SALES" | "CLICKS" | "INSTALLS";
  milestoneValue: number;
  rewardType: "DISCOUNT_COUPON" | "FREE_SUBSCRIPTION" | "PLAN_UPGRADE" | "ACCESS_PERK" | "MONEY";
  rewardAmount: number | null;
  rewardCurrency: string | null;
  earnLimit: "ONCE_PER_MARKETER" | "MULTIPLE";
  availabilityType: "UNLIMITED" | "FIRST_N";
  availabilityLimit: number | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  allowedMarketerIds?: string[] | null;
};

type PurchaseRow = {
  projectId: string;
  amount: number;
  marketerId: string | null;
  customerEmail: string | null;
  createdAt: string;
  coupon: { marketerId: string | null } | null;
};

type AttributionRow = {
  projectId: string;
  marketerId: string;
  deviceId: string;
  createdAt: string;
};

type EarnedRow = {
  id: string;
  rewardId: string;
  marketerId: string;
  sequence: number;
};

const getMetricValue = (
  reward: RewardRow,
  totals: {
    revenue: number;
    sales: number;
    clicks: number;
    installs: number;
  },
) => {
  if (reward.milestoneType === "NET_REVENUE") return totals.revenue;
  if (reward.milestoneType === "COMPLETED_SALES") return totals.sales;
  if (reward.milestoneType === "CLICKS") return totals.clicks;
  return totals.installs;
};

const createId = () => crypto.randomUUID();

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response("Missing Supabase env vars.", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const now = new Date();

  const { data: rewards, error: rewardsError } = await supabase
    .from("Reward")
    .select(
      "id,projectId,name,startsAt,createdAt,milestoneType,milestoneValue,rewardType,rewardAmount,rewardCurrency,earnLimit,availabilityType,availabilityLimit,status,allowedMarketerIds",
    )
    .eq("status", "ACTIVE");

  if (rewardsError) {
    return new Response(rewardsError.message, { status: 500 });
  }

  const activeRewards = (rewards ?? []) as RewardRow[];
  if (activeRewards.length === 0) {
    return new Response(JSON.stringify({ ok: true, created: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const rewardMap = new Map(activeRewards.map((reward) => [reward.id, reward]));

  const projectIds = Array.from(
    new Set(activeRewards.map((reward) => reward.projectId)),
  );
  const { data: projectRows, error: projectError } = await supabase
    .from("Project")
    .select("id,name,userId")
    .in("id", projectIds);

  if (projectError) {
    return new Response(projectError.message, { status: 500 });
  }

  const projectNameById = new Map(
    (projectRows ?? []).map((row) => [row.id, row.name]),
  );
  const projectCreatorById = new Map(
    (projectRows ?? []).map((row) => [row.id, row.userId]),
  );

  const { data: purchases, error: purchasesError } = await supabase
    .from("Purchase")
    .select("projectId,amount,marketerId,customerEmail,createdAt,coupon:Coupon(marketerId)")
    .in("projectId", projectIds)
    .not("commissionStatus", "in", '("REFUNDED","CHARGEBACK")')
    .not("refundEligibleAt", "is", null)
    .lte("refundEligibleAt", now.toISOString());

  if (purchasesError) {
    return new Response(purchasesError.message, { status: 500 });
  }

  const { data: attributionRows, error: attributionError } = await supabase
    .from("AttributionClick")
    .select("projectId,marketerId,deviceId,createdAt")
    .in("projectId", projectIds);

  if (attributionError) {
    return new Response(attributionError.message, { status: 500 });
  }

  const purchasesByProjectMarketer = new Map<string, PurchaseRow[]>();

  for (const row of (purchases ?? []) as PurchaseRow[]) {
    const marketerId = row.coupon?.marketerId ?? row.marketerId;
    if (!row.projectId || !marketerId) continue;
    const key = `${row.projectId}:${marketerId}`;
    const existing = purchasesByProjectMarketer.get(key) ?? [];
    existing.push(row);
    purchasesByProjectMarketer.set(key, existing);
  }

  const attributionByProjectMarketer = new Map<string, AttributionRow[]>();
  for (const row of (attributionRows ?? []) as AttributionRow[]) {
    if (!row.projectId || !row.marketerId) continue;
    const key = `${row.projectId}:${row.marketerId}`;
    const existing = attributionByProjectMarketer.get(key) ?? [];
    existing.push(row);
    attributionByProjectMarketer.set(key, existing);
  }

  const { data: earnedRows, error: earnedError } = await supabase
    .from("RewardEarned")
    .select("id,rewardId,marketerId,sequence")
    .in(
      "rewardId",
      activeRewards.map((reward) => reward.id),
    );

  if (earnedError) {
    return new Response(earnedError.message, { status: 500 });
  }

  const earnedByRewardMarketer = new Map<string, EarnedRow[]>();
  const earnedMarketersByReward = new Map<string, Set<string>>();
  for (const row of (earnedRows ?? []) as EarnedRow[]) {
    const key = `${row.rewardId}:${row.marketerId}`;
    const existing = earnedByRewardMarketer.get(key) ?? [];
    existing.push(row);
    earnedByRewardMarketer.set(key, existing);

    const rewardSet = earnedMarketersByReward.get(row.rewardId) ?? new Set();
    rewardSet.add(row.marketerId);
    earnedMarketersByReward.set(row.rewardId, rewardSet);
  }

  const inserts: Array<Record<string, unknown>> = [];

  for (const reward of activeRewards) {
    const rewardStart = new Date(reward.startsAt ?? reward.createdAt);
    const earnedMarketers =
      earnedMarketersByReward.get(reward.id) ?? new Set<string>();
    const projectKeys = new Set<string>();
    for (const key of purchasesByProjectMarketer.keys()) {
      if (key.startsWith(`${reward.projectId}:`)) {
        projectKeys.add(key);
      }
    }
    for (const key of attributionByProjectMarketer.keys()) {
      if (key.startsWith(`${reward.projectId}:`)) {
        projectKeys.add(key);
      }
    }

    for (const key of projectKeys) {
      const [projectId, marketerId] = key.split(":");
      if (projectId !== reward.projectId) continue;
      const allowed = Array.isArray(reward.allowedMarketerIds)
        ? reward.allowedMarketerIds
        : [];
      if (allowed.length > 0 && !allowed.includes(marketerId)) {
        continue;
      }

      const purchaseRows = purchasesByProjectMarketer.get(key) ?? [];
      const attributionRowsForKey = attributionByProjectMarketer.get(key) ?? [];
      const totals = { revenue: 0, sales: 0, clicks: 0, installs: 0 };
      for (const row of purchaseRows) {
        const createdAt = new Date(row.createdAt);
        if (Number.isNaN(createdAt.getTime()) || createdAt < rewardStart) {
          continue;
        }
        totals.revenue += Number(row.amount) || 0;
        totals.sales += 1;
      }

      for (const row of attributionRowsForKey) {
        const createdAt = new Date(row.createdAt);
        if (Number.isNaN(createdAt.getTime()) || createdAt < rewardStart) {
          continue;
        }
        if (row.deviceId?.startsWith("click:")) {
          totals.clicks += 1;
          continue;
        }
        if (row.deviceId?.startsWith("install:")) {
          totals.installs += 1;
        }
      }

      const metricValue = getMetricValue(reward, {
        revenue: totals.revenue,
        sales: totals.sales,
        clicks: totals.clicks,
        installs: totals.installs,
      });
      if (reward.milestoneValue <= 0) continue;
      const achieved = Math.floor(metricValue / reward.milestoneValue);
      if (achieved <= 0) continue;

      const existing =
        earnedByRewardMarketer.get(`${reward.id}:${marketerId}`) ?? [];
      const existingCount = existing.length;
      const desired =
        reward.earnLimit === "ONCE_PER_MARKETER" ? 1 : achieved;
      if (existingCount >= desired) continue;

      if (
        reward.availabilityType === "FIRST_N" &&
        !earnedMarketers.has(marketerId)
      ) {
        if (
          reward.availabilityLimit &&
          earnedMarketers.size >= reward.availabilityLimit
        ) {
          continue;
        }
        earnedMarketers.add(marketerId);
        earnedMarketersByReward.set(reward.id, earnedMarketers);
      }

      for (let index = existingCount + 1; index <= desired; index += 1) {
        const rewardAmount =
          reward.rewardType === "MONEY" ? reward.rewardAmount ?? 0 : null;
        const rewardCurrency =
          reward.rewardType === "MONEY" ? reward.rewardCurrency ?? null : null;
        inserts.push({
          id: createId(),
          rewardId: reward.id,
          projectId: reward.projectId,
          marketerId,
          sequence: index,
          status: "UNLOCKED",
          earnedAt: now.toISOString(),
          unlockedAt: now.toISOString(),
          rewardAmount,
          rewardCurrency,
        });
      }
    }
  }

  if (inserts.length === 0) {
    return new Response(JSON.stringify({ ok: true, created: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: insertError } = await supabase
    .from("RewardEarned")
    .insert(inserts);

  if (insertError) {
    return new Response(insertError.message, { status: 500 });
  }

  const events = inserts.map((entry) => {
    const rewardId = entry.rewardId as string;
    const reward = rewardMap.get(rewardId);
    return {
      id: createId(),
      type: "REWARD_EARNED",
      actorId: entry.marketerId,
      projectId: entry.projectId,
      subjectType: "Reward",
      subjectId: rewardId,
      data: {
        rewardId,
        rewardName: reward?.name ?? rewardId,
        marketerId: entry.marketerId,
        sequence: entry.sequence,
      },
    };
  });

  const { data: createdEvents, error: eventError } = await supabase
    .from("Event")
    .insert(events)
    .select("id,projectId,actorId,data");
  if (eventError) {
    // Do not block marketer notifications if event insertion fails.
    console.error("Failed to insert REWARD_EARNED events:", eventError.message);
  }

  const eventIdByKey = new Map<string, string>();
  for (const row of createdEvents ?? []) {
    const data = (row.data ?? {}) as {
      rewardId?: string;
      marketerId?: string;
      sequence?: number;
    };
    if (!row.projectId || !data.rewardId || !data.marketerId) continue;
    const key = `${row.projectId}:${data.rewardId}:${data.marketerId}:${data.sequence ?? 1}`;
    eventIdByKey.set(key, row.id);
  }

  const notifications = inserts.flatMap((entry) => {
    const rewardId = entry.rewardId as string;
    const projectId = entry.projectId as string;
    const reward = rewardMap.get(rewardId);
    const projectName = projectNameById.get(projectId) ?? "this project";
    const creatorId = projectCreatorById.get(projectId);
    const eventKey = `${projectId}:${rewardId}:${entry.marketerId}:${entry.sequence ?? 1}`;
    const eventId = eventIdByKey.get(eventKey);

    const marketerNotification = {
      id: createId(),
      userId: entry.marketerId,
      ...(eventId ? { eventId } : {}),
      type: "SYSTEM",
      ...rewardUnlockedMessage(reward?.name ?? "Reward", projectName),
      data: {
        rewardId,
        projectId,
        milestoneType: reward?.milestoneType ?? null,
        milestoneValue: reward?.milestoneValue ?? null,
      },
    };

    if (!creatorId) {
      return [marketerNotification];
    }

    const creatorNotification = {
      id: createId(),
      userId: creatorId,
      ...(eventId ? { eventId } : {}),
      type: "SYSTEM",
      ...rewardUnlockedCreatorMessage(
        entry.marketerId as string,
        reward?.name ?? "Reward",
        projectName,
      ),
      data: {
        rewardId,
        projectId,
        marketerId: entry.marketerId,
      },
    };

    return [marketerNotification, creatorNotification];
  });

  const { error: notificationError } = await supabase
    .from("Notification")
    .insert(notifications);
  if (notificationError) {
    return new Response(notificationError.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, created: inserts.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
