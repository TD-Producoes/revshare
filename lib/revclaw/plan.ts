import { z } from "zod";
import { hashPayload } from "@/lib/revclaw/crypto";

export const planProjectSchema = z.object({
  mode: z.enum(["create"]),
  name: z.string().min(1).max(120),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  website: z.string().url().max(2048).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  refundWindowDays: z.number().int().min(0).max(365).optional().nullable(),
  marketerCommissionPercent: z.number().min(0).max(100).optional().nullable(),
  platformCommissionPercent: z.number().min(0).max(100).optional().nullable(),
});

export const planCouponTemplateSchema = z.object({
  client_ref: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  description: z.string().max(5000).optional().nullable(),
  percentOff: z.number().int().min(1).max(100),
  durationType: z.enum(["ONCE", "REPEATING"]),
  durationInMonths: z.number().int().min(1).max(12).optional().nullable(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  maxRedemptions: z.number().int().min(1).optional().nullable(),
});

export const planRewardSchema = z.object({
  client_ref: z.string().min(1).max(80),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  milestoneType: z.enum(["NET_REVENUE", "COMPLETED_SALES", "CLICKS", "INSTALLS"]),
  milestoneValue: z.number().int().min(1),
  startsAt: z.string().optional().nullable(),
  rewardType: z.enum([
    "DISCOUNT_COUPON",
    "FREE_SUBSCRIPTION",
    "PLAN_UPGRADE",
    "ACCESS_PERK",
    "MONEY",
  ]),
  rewardPercentOff: z.number().int().min(1).max(100).optional().nullable(),
  rewardDurationMonths: z.number().int().min(1).max(12).optional().nullable(),
  rewardAmount: z.number().int().min(1).optional().nullable(),
  fulfillmentType: z.enum(["AUTO_COUPON", "MANUAL"]),
  earnLimit: z.enum(["ONCE_PER_MARKETER", "MULTIPLE"]),
  availabilityType: z.enum(["UNLIMITED", "FIRST_N"]),
  availabilityLimit: z.number().int().min(1).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  allowedMarketerIds: z.array(z.string().min(1)).optional().nullable(),
});

export const planInvitationsSchema = z
  .object({
    enabled: z.boolean(),
    maxMarketers: z.number().int().min(1).max(20).default(20),
    // Generic message to send (no names).
    message: z.string().min(1).max(5000),
    commissionPercent: z.number().min(0).max(100).optional().nullable(),
    refundWindowDays: z.number().int().min(0).max(365).optional().nullable(),
  })
  .optional();

const marketerApplicationSchema = z.object({
  commissionPercent: z.number().min(0).max(100),
  refundWindowDays: z.number().int().min(0).max(3650).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

const marketerCouponSchema = z.object({
  templateId: z.string().min(1),
  code: z.string().min(3).optional().nullable(),
  extraCoupons: z.number().int().min(0).max(5).optional().default(0),
});

const marketerPromoSchema = z.object({
  angle: z.enum(["short", "twitter", "linkedin", "reddit", "email"]).optional().default("short"),
});

export const marketerPromoPlanSchema = z.object({
  kind: z.literal("MARKETER_PROMO_PLAN"),
  project: z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(120).optional().nullable(),
  }),
  application: marketerApplicationSchema.optional(),
  coupon: marketerCouponSchema,
  promo: marketerPromoSchema.optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const marketerBatchPromoPlanSchema = z.object({
  kind: z.literal("MARKETER_BATCH_PROMO_PLAN"),
  items: z
    .array(
      z.object({
        project: z.object({
          id: z.string().min(1),
          name: z.string().min(1).max(120).optional().nullable(),
        }),
        application: marketerApplicationSchema.optional(),
        coupon: marketerCouponSchema,
        promo: marketerPromoSchema.optional(),
        notes: z.string().max(5000).optional().nullable(),
      }),
    )
    .min(1)
    .max(20),
  notes: z.string().max(5000).optional().nullable(),
});

export const projectLaunchPlanSchema = z
  .object({
    kind: z.literal("PROJECT_LAUNCH_PLAN"),
    project: planProjectSchema,
    couponTemplates: z.array(planCouponTemplateSchema).optional().default([]),
    rewards: z.array(planRewardSchema).optional().default([]),
    invitations: planInvitationsSchema,
    publish: z
      .object({
        enabled: z.boolean(),
      })
      .optional(),
    notes: z.string().max(5000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.invitations?.enabled) {
      if (!val.project.category || !val.project.category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["project", "category"],
          message: "project.category is required when invitations.enabled=true",
        });
      }
    }
  });

export const revclawPlanSchema = z.discriminatedUnion("kind", [
  projectLaunchPlanSchema,
  marketerPromoPlanSchema,
  marketerBatchPromoPlanSchema,
]);

export type RevclawPlanJson = z.infer<typeof revclawPlanSchema>;

export function computePlanHash(plan: RevclawPlanJson): string {
  // hashPayload is deterministic for objects/arrays (JSON stringify)
  return hashPayload(plan);
}
