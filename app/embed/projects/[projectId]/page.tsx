import { prisma } from "@/lib/prisma";

type EmbedField = "revenue" | "rewards" | "commission";
type EmbedTheme = "light" | "dark" | "auto";
type EmbedLayout = "compact" | "standard";

const ALLOWED_FIELDS: EmbedField[] = ["revenue", "rewards", "commission"];

function parseFields(raw: string | undefined): EmbedField[] {
  if (raw === undefined) {
    return [...ALLOWED_FIELDS];
  }

  if (raw.trim() === "") {
    return [];
  }

  const selected = (raw ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is EmbedField =>
      ALLOWED_FIELDS.includes(value as EmbedField)
    );

  return ALLOWED_FIELDS.filter((field) => selected.includes(field));
}

function parseTheme(raw: string | undefined): EmbedTheme {
  if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  return "auto";
}

function parseLayout(raw: string | undefined): EmbedLayout {
  if (raw === "compact" || raw === "standard") return raw;
  return "standard";
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return `${Math.round(value)}%`;
}

function formatMilestoneCopy(
  milestoneType: "NET_REVENUE" | "COMPLETED_SALES" | "CLICKS" | "INSTALLS",
  milestoneValue: number,
  currency: string
): string {
  if (milestoneType === "NET_REVENUE") {
    return `${formatCurrency(milestoneValue / 100, currency)} net revenue`;
  }
  if (milestoneType === "COMPLETED_SALES") {
    return `${milestoneValue} completed sales`;
  }
  if (milestoneType === "CLICKS") {
    return `${milestoneValue} clicks`;
  }
  return `${milestoneValue} installs`;
}

function formatRewardCopy(
  reward: {
    rewardType: "DISCOUNT_COUPON" | "FREE_SUBSCRIPTION" | "PLAN_UPGRADE" | "MONEY" | "ACCESS_PERK";
    rewardPercentOff: number | null;
    rewardDurationMonths: number | null;
    rewardAmount: number | null;
    rewardCurrency: string | null;
    rewardLabel: string | null;
  },
  currency: string
): string {
  if (reward.rewardType === "DISCOUNT_COUPON") {
    return `${reward.rewardPercentOff ?? 0}% discount`;
  }
  if (reward.rewardType === "FREE_SUBSCRIPTION") {
    const months = reward.rewardDurationMonths ?? 1;
    return `Free ${months} month${months === 1 ? "" : "s"}`;
  }
  if (reward.rewardType === "PLAN_UPGRADE") {
    return reward.rewardLabel?.trim() || "Plan upgrade";
  }
  if (reward.rewardType === "MONEY") {
    const rewardCurrency = reward.rewardCurrency ?? currency;
    return formatCurrency((reward.rewardAmount ?? 0) / 100, rewardCurrency);
  }
  return reward.rewardLabel?.trim() || "Access perk";
}

export default async function ProjectEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    fields?: string;
    theme?: string;
    layout?: string;
  }>;
}) {
  const { projectId } = await params;
  const query = await searchParams;
  const fields = parseFields(query.fields);
  const theme = parseTheme(query.theme);
  const layout = parseLayout(query.layout);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      currency: true,
      marketerCommissionPercent: true,
      visibility: true,
      showRevenue: true,
      showStats: true,
    },
  });

  if (!project || project.visibility === "PRIVATE") {
    return (
      <main className="h-full w-full overflow-hidden bg-transparent p-0">
        <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-600">
          Widget unavailable for this project.
        </div>
      </main>
    );
  }

  const [revenueAgg, publicRewards] = await Promise.all([
    fields.includes("revenue") && project.showRevenue
      ? prisma.purchase.aggregate({
          where: {
            projectId,
            status: "PAID",
          },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    fields.includes("rewards") && project.showStats
      ? prisma.reward.findMany({
          where: {
            projectId,
            status: "ACTIVE",
            visibility: "PUBLIC",
          },
          select: {
            milestoneType: true,
            milestoneValue: true,
            rewardType: true,
            rewardPercentOff: true,
            rewardDurationMonths: true,
            rewardAmount: true,
            rewardCurrency: true,
            rewardLabel: true,
          },
          orderBy: { milestoneValue: "asc" },
          take: layout === "compact" ? 1 : 2,
        })
      : Promise.resolve([]),
  ]);

  const currency = project.currency?.toUpperCase() || "USD";
  const totalRevenue = ((revenueAgg?._sum.amount ?? 0) / 100) as number;
  const commissionPercent = Number(project.marketerCommissionPercent ?? 0);
  const rewardDescriptions = (publicRewards ?? []).map(
    (reward) =>
      `${formatMilestoneCopy(
        reward.milestoneType,
        reward.milestoneValue,
        currency
      )} -> ${formatRewardCopy(reward, currency)}`
  );

  const effectiveFields = fields.filter((field) => {
    if (field === "revenue") return project.showRevenue;
    if (field === "rewards") return project.showStats;
    return true;
  });
  const showRevenue = effectiveFields.includes("revenue");
  const showCommission = effectiveFields.includes("commission");
  const showRewards = effectiveFields.includes("rewards");
  const ctaOnly = effectiveFields.length === 0;

  const isCompact = layout === "compact";
  const isDarkTheme = theme === "dark";

  // Color schemes
  const bgClass = isDarkTheme
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-br from-white via-slate-50 to-white";
  const borderClass = isDarkTheme
    ? "border-slate-700/50"
    : "border-slate-200/60";
  const textClass = isDarkTheme ? "text-slate-100" : "text-slate-900";
  const subtextClass = isDarkTheme ? "text-slate-400" : "text-slate-600";
  const accentClass = isDarkTheme ? "text-amber-400" : "text-amber-600";
  const chipClass = isDarkTheme
    ? "border-slate-600/50 bg-slate-800/50 backdrop-blur-sm"
    : "border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm";
  const ctaClass =
    "border-yellow-300/90 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-200 text-slate-900 hover:from-yellow-200 hover:via-amber-200 hover:to-yellow-100 shadow-lg hover:shadow-xl";

  return (
    <main className="h-full w-full overflow-hidden bg-transparent p-0">
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent;
        }
      `}</style>
      <div className="h-full flex items-center justify-center p-3">
        {ctaOnly ? (
          <div className={`${bgClass} ${borderClass} border rounded-2xl ${isCompact ? "p-4" : "p-6"} shadow-xl`}>
            <div className="flex flex-col items-center text-center gap-3">
              <div>
                <div className={`${subtextClass} text-xs font-medium uppercase tracking-wider mb-1`}>
                  Join Our
                </div>
                <h2 className={`${textClass} ${isCompact ? "text-lg" : "text-2xl"} font-bold`}>
                  Affiliate Program
                </h2>
              </div>
              <a
                href={`/projects/${project.id}?intent=affiliate_apply&src=widget`}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-center font-semibold transition-all ${ctaClass} ${
                  isCompact ? "text-sm" : "text-base"
                }`}
              >
                Become an Affiliate
              </a>
            </div>
          </div>
        ) : (
          <div className={`${bgClass} ${borderClass} border rounded-2xl ${isCompact ? "p-4" : "p-6"} shadow-xl ${isCompact ? "max-w-md" : "max-w-lg"} w-full`}>
            <div className={`flex flex-col ${isCompact ? "gap-3" : "gap-4"}`}>
              {/* Header */}
              <div className="space-y-1">
                <div className={`${subtextClass} ${isCompact ? "text-[10px]" : "text-xs"} font-medium uppercase tracking-wider flex items-center gap-2`}>
                  <svg className={`${isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} ${accentClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Affiliate Program
                </div>
                <h1 className={`${textClass} ${isCompact ? "text-xl" : "text-2xl"} font-bold tracking-tight`}>
                  {project.name}
                </h1>
              </div>

              {/* Stats Grid */}
              {(showRevenue || showCommission) && (
                <div className={`grid ${showRevenue && showCommission ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                  {showRevenue && (
                    <div className={`${chipClass} border rounded-xl ${isCompact ? "p-2.5" : "p-3"}`}>
                      <div className={`${subtextClass} ${isCompact ? "text-[10px]" : "text-xs"} font-medium uppercase tracking-wide mb-1`}>
                        Total Revenue
                      </div>
                      <div className={`${textClass} ${isCompact ? "text-lg" : "text-2xl"} font-bold`}>
                        {formatCurrency(totalRevenue, currency)}
                      </div>
                      <div className={`${subtextClass} ${isCompact ? "text-[10px]" : "text-xs"} flex items-center gap-1 mt-0.5`}>
                        <svg className={`${isCompact ? "h-2.5 w-2.5" : "h-3 w-3"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Stripe verified
                      </div>
                    </div>
                  )}
                  {showCommission && (
                    <div className={`${chipClass} border rounded-xl ${isCompact ? "p-2.5" : "p-3"}`}>
                      <div className={`${subtextClass} ${isCompact ? "text-[10px]" : "text-xs"} font-medium uppercase tracking-wide mb-1`}>
                        Commission
                      </div>
                      <div className={`${accentClass} ${isCompact ? "text-lg" : "text-2xl"} font-bold`}>
                        {formatPercent(commissionPercent)}
                      </div>
                      <div className={`${subtextClass} ${isCompact ? "text-[10px]" : "text-xs"}`}>
                        per sale
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rewards */}
              {showRewards && rewardDescriptions.length > 0 && (
                <div className={`${chipClass} border rounded-xl ${isCompact ? "p-2.5" : "p-3"}`}>
                  <div className={`${subtextClass} ${isCompact ? "text-[10px]" : "text-xs"} font-medium uppercase tracking-wide mb-2`}>
                    🎁 Milestone Rewards
                  </div>
                  <div className={isCompact ? "space-y-1" : "space-y-1.5"}>
                    {rewardDescriptions.map((description, index) => (
                      <div
                        key={`${description}-${index}`}
                        className={`${textClass} ${isCompact ? "text-xs" : "text-sm"} flex items-start gap-2`}
                      >
                        <span className={`${accentClass} ${isCompact ? "text-xs" : "text-sm"} mt-0.5`}>•</span>
                        <span className="leading-snug">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <a
                href={`/projects/${project.id}?intent=affiliate_apply&src=widget`}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-center font-semibold transition-all ${ctaClass} ${
                  isCompact ? "text-sm" : "text-base"
                }`}
              >
                Become an Affiliate
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
