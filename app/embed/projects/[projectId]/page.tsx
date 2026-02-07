import { prisma } from "@/lib/prisma";

type EmbedField = "revenue" | "rewards" | "commission";
type EmbedTheme = "light" | "dark" | "auto";
type EmbedLayout = "compact" | "standard" | "minimal";

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
  if (raw === "compact" || raw === "standard" || raw === "minimal") return raw;
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
  const isMinimal = layout === "minimal";
  const isDarkTheme = theme === "dark";

  // Minimal color schemes - very subtle
  const bgClass = isDarkTheme
    ? "bg-slate-900/40 backdrop-blur-sm"
    : "bg-white/60 backdrop-blur-sm";
  const borderClass = isDarkTheme
    ? "border-slate-700/30"
    : "border-slate-200/40";
  const textClass = isDarkTheme ? "text-slate-100" : "text-slate-900";
  const subtextClass = isDarkTheme ? "text-slate-500" : "text-slate-600";
  const accentClass = isDarkTheme ? "text-amber-500" : "text-amber-600";
  const chipClass = isDarkTheme
    ? "border-slate-700/40 bg-slate-800/30"
    : "border-slate-200/50 bg-slate-50/50";
  const ctaClass =
    "border-yellow-300/90 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-200 text-slate-900 hover:from-yellow-200 hover:via-amber-200 hover:to-yellow-100";

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
      <div className="h-full flex items-center justify-center p-2">
        {isMinimal ? (
          <a
            href={`/projects/${project.id}?intent=affiliate_apply&src=widget`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-all border-yellow-300/90 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-200 text-slate-900 hover:from-yellow-200 hover:via-amber-200 hover:to-yellow-100"
          >
            Become an Affiliate
            <svg className="ml-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        ) : ctaOnly ? (
          <div className={`${bgClass} ${borderClass} border rounded-lg ${isCompact ? "p-3" : "p-4"}`}>
            <div className="flex flex-col items-center text-center gap-2">
              <div>
                <div className={`${subtextClass} text-[10px] font-medium uppercase tracking-wide mb-0.5`}>
                  Join Our
                </div>
                <h2 className={`${textClass} ${isCompact ? "text-base" : "text-lg"} font-semibold`}>
                  Affiliate Program
                </h2>
              </div>
              <a
                href={`/projects/${project.id}?intent=affiliate_apply&src=widget`}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-center font-medium transition-all ${ctaClass} ${
                  isCompact ? "text-xs" : "text-sm"
                }`}
              >
                Become an Affiliate
              </a>
            </div>
          </div>
        ) : (
          <div className={`${bgClass} ${borderClass} border rounded-lg ${isCompact ? "p-2" : "p-4"} ${isCompact ? "max-w-xs" : "max-w-md"} w-full`}>
            <div className={`flex flex-col ${isCompact ? "gap-1.5" : "gap-3"}`}>
              {/* Header with inline badges */}
              <div className={isCompact ? "space-y-1" : "space-y-1.5"}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className={`${subtextClass} ${isCompact ? "text-[8px]" : "text-[9px]"} font-medium uppercase tracking-wide ${isCompact ? "mb-0" : "mb-0.5"}`}>
                      Affiliate Program
                    </div>
                    <h1 className={`${textClass} ${isCompact ? "text-sm" : "text-lg"} font-semibold ${isCompact ? "leading-tight" : ""}`}>
                      {project.name}
                    </h1>
                  </div>
                </div>

                {/* Stats Badges - Single row */}
                {(showRevenue || showCommission) && (
                  <div className={`flex flex-wrap items-center ${isCompact ? "gap-1" : "gap-1.5"}`}>
                    {showRevenue && (
                      <span className={`${chipClass} border rounded-full ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-medium inline-flex items-center gap-1`}>
                        <svg className={`${isCompact ? "h-2 w-2" : "h-2.5 w-2.5"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={textClass}>{formatCurrency(totalRevenue, currency)}</span>
                        {!isCompact && <span className={subtextClass}>revenue</span>}
                      </span>
                    )}
                    {showCommission && (
                      <span className={`${chipClass} border rounded-full ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-medium inline-flex items-center gap-1`}>
                        <span className={accentClass}>{formatPercent(commissionPercent)}</span>
                        {!isCompact && <span className={subtextClass}>commission</span>}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Rewards */}
              {showRewards && rewardDescriptions.length > 0 && (
                <div className={`${chipClass} border rounded-md ${isCompact ? "p-1.5" : "p-2.5"}`}>
                  <div className={`${subtextClass} ${isCompact ? "text-[8px]" : "text-[9px]"} font-medium uppercase tracking-wide ${isCompact ? "mb-0.5" : "mb-1"}`}>
                    Rewards
                  </div>
                  <div className={isCompact ? "space-y-0" : "space-y-0.5"}>
                    {rewardDescriptions.map((description, index) => (
                      <div
                        key={`${description}-${index}`}
                        className={`${textClass} ${isCompact ? "text-[9px]" : "text-[10px]"} flex items-start gap-1`}
                      >
                        <span className={`${accentClass} ${isCompact ? "text-[9px]" : "text-[10px]"} mt-0.5`}>•</span>
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
                className={`inline-flex items-center justify-center rounded-full border ${isCompact ? "px-3 py-1.5" : "px-4 py-2"} text-center font-medium transition-all ${ctaClass} ${
                  isCompact ? "text-[11px]" : "text-sm"
                }`}
              >
                Become an Affiliate
                <svg className={`${isCompact ? "ml-1 h-3 w-3" : "ml-1.5 h-3.5 w-3.5"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
