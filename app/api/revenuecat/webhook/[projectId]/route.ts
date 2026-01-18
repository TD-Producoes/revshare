import { NextResponse } from "next/server";
import crypto from "crypto";
import * as React from "react";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { notificationMessages } from "@/lib/notifications/messages";
import { sendEmail } from "@/lib/email/send-email";
import ReferralSaleEmail from "@/emails/ReferralSaleEmail";

export const runtime = "nodejs";

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_id?: string;
  project_id?: string;
  event_timestamp_ms?: number;
  purchase_date_ms?: number;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  app_user_id?: string;
  original_app_user_id?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  price?: number | string;
  price_in_purchased_currency?: number | string;
  currency?: string;
  cancel_reason?: string;
  subscriber_attributes?: Record<string, { value?: string }>;
  metadata?: Record<string, string>;
};

function timingSafeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function extractMarketerId(event: RevenueCatEvent) {
  return (
    event.subscriber_attributes?.marketer_id?.value ??
    event.subscriber_attributes?.marketerId?.value ??
    event.metadata?.marketer_id ??
    event.metadata?.marketerId ??
    null
  );
}

function toAmountInCents(
  price?: number | string,
  fallback?: number | string,
) {
  const candidate = price ?? fallback;
  if (candidate === undefined || candidate === null) return 0;
  const numeric = typeof candidate === "string" ? Number(candidate) : candidate;
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

function respond(reason: string, status = 200, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { received: status === 200, reason, ...extra },
    { status },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const revenueCatProjectId = projectId;
  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("x-revenuecat-signature") ??
    request.headers.get("x-webhook-authorization");

  const raw = await request.text();
  let payload: { event?: RevenueCatEvent } | RevenueCatEvent;
  try {
    payload = JSON.parse(raw);
  } catch {
    return respond("invalid_payload", 400, { error: "Invalid payload" });
  }

  const event: RevenueCatEvent =
    "event" in payload ? payload.event ?? {} : payload;
  const eventId = event.id;
  const eventType = event.type;

  if (!eventId || !eventType || !revenueCatProjectId) {
    return respond("missing_event_data", 400, {
      error: "Missing required event data",
    });
  }

  const integration = await prisma.projectIntegration.findFirst({
    where: { provider: "REVENUECAT", externalId: revenueCatProjectId },
    select: {
      projectId: true,
      webhookSecretCipherText: true,
      webhookSecretIv: true,
      webhookSecretTag: true,
    },
  });

  if (!integration) {
    return respond("project_not_found", 404, { error: "Project not found" });
  }

  const token = authHeader?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!token) {
    return respond("missing_token", 401, { error: "Unauthorized" });
  }
  let webhookSecret: string;
  try {
    webhookSecret = decryptSecret(
      integration.webhookSecretCipherText,
      integration.webhookSecretIv,
      integration.webhookSecretTag,
    );
  } catch (error) {
    console.error("Failed to decrypt RevenueCat webhook secret", error);
    return respond("decrypt_failed", 401, { error: "Unauthorized" });
  }
  if (!timingSafeEqual(token, webhookSecret)) {
    return respond("invalid_token", 401, { error: "Unauthorized" });
  }

  const project = await prisma.project.findUnique({
    where: { id: integration.projectId },
    select: {
      id: true,
      name: true,
      userId: true,
      refundWindowDays: true,
      marketerCommissionPercent: true,
    },
  });

  if (!project) {
    return respond("project_missing", 404, { error: "Project not found" });
  }

  const marketerId = extractMarketerId(event);
  const contract = marketerId
    ? await prisma.contract.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: marketerId,
          },
        },
        select: { refundWindowDays: true, status: true, commissionPercent: true },
      })
    : null;

  const isContractApproved = contract?.status === "APPROVED";
  const commissionPercent =
    isContractApproved && contract?.commissionPercent != null
      ? Number(contract.commissionPercent)
      : Number(project.marketerCommissionPercent ?? 0);

  const amount = toAmountInCents(
    event.price_in_purchased_currency,
    event.price,
  );
  const commissionAmount =
    marketerId && isContractApproved && amount > 0
      ? Math.round(amount * commissionPercent)
      : 0;

  const eventTimeMs =
    event.purchased_at_ms ??
    event.purchase_date_ms ??
    event.event_timestamp_ms ??
    Date.now();
  const eventCreatedAt = new Date(eventTimeMs);
  const refundWindowDays =
    contract?.refundWindowDays ?? project.refundWindowDays ?? 30;
  const refundEligibleAt = new Date(
    eventCreatedAt.getTime() + refundWindowDays * 24 * 60 * 60 * 1000,
  );
  const isRefundEligible = refundEligibleAt <= new Date();

  const commissionStatus =
    commissionAmount > 0
      ? isRefundEligible
        ? "PENDING_CREATOR_PAYMENT"
        : "AWAITING_REFUND_WINDOW"
      : "PAID";

  const payoutStatus = commissionAmount > 0 ? "PENDING" : "PAID";

  const revenueEvents = new Set([
    "INITIAL_PURCHASE",
    "RENEWAL",
    "NON_RENEWING_PURCHASE",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
  ]);
  const cancellationEvents = new Set(["CANCELLATION"]);
  const refundEvents = new Set(["REFUND"]);

  const findPurchaseForRefund = async () => {
    return prisma.purchase.findFirst({
      where: {
        projectId: project.id,
        OR: [
          { revenueCatEventId: eventId },
          event.transaction_id
            ? { revenueCatTransactionId: event.transaction_id }
            : undefined,
          event.original_transaction_id
            ? { revenueCatTransactionId: event.original_transaction_id }
            : undefined,
        ].filter(Boolean) as Array<{
          revenueCatEventId?: string;
          revenueCatTransactionId?: string;
        }>,
      },
      select: { id: true, amount: true },
    });
  };

  const handleRefundEvent = async () => {
    const existing = await findPurchaseForRefund();
    if (!existing) {
      return respond("refund_event_no_purchase");
    }
    const refundedAmount = amount > 0 ? amount : existing.amount;
    await prisma.purchase.update({
      where: { id: existing.id },
      data: {
        refundedAt: new Date(),
        refundedAmount,
        commissionStatus: "REFUNDED",
        status: "FAILED",
      },
    });
    await prisma.event.create({
      data: {
        type: "PURCHASE_REFUNDED",
        projectId: project.id,
        subjectType: "Purchase",
        subjectId: existing.id,
        data: { amount: refundedAmount, currency: event.currency ?? "usd" },
      },
    });
    return respond("refund_event_processed");
  };

  if (cancellationEvents.has(eventType)) {
    if (event.cancel_reason === "CUSTOMER_SUPPORT") {
      return handleRefundEvent();
    }
    return respond("cancellation_event");
  }

  if (refundEvents.has(eventType)) {
    return handleRefundEvent();
  }

  if (!revenueEvents.has(eventType)) {
    return respond("event_ignored");
  }

  const existing = await prisma.purchase.findFirst({
    where: {
      projectId: project.id,
      OR: [
        { revenueCatEventId: eventId },
        event.transaction_id
          ? { revenueCatTransactionId: event.transaction_id }
          : undefined,
      ].filter(Boolean) as Array<{
        revenueCatEventId?: string;
        revenueCatTransactionId?: string;
      }>,
    },
  });

  if (existing) {
    return respond("duplicate_event");
  }

  const purchase = await prisma.purchase.create({
    data: {
      projectId: project.id,
      couponId: null,
      marketerId: marketerId && isContractApproved ? marketerId : null,
      revenueCatEventId: eventId,
      revenueCatTransactionId: event.transaction_id ?? null,
      amount,
      currency: (event.currency ?? "usd").toLowerCase(),
      customerEmail: null,
      commissionAmount,
      commissionAmountOriginal: commissionAmount,
      refundWindowDays,
      refundEligibleAt,
      commissionStatus,
      status: payoutStatus,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  await prisma.event.create({
    data: {
      type: "PURCHASE_CREATED",
      actorId: marketerId && isContractApproved ? marketerId : null,
      projectId: project.id,
      subjectType: "Purchase",
      subjectId: purchase.id,
      data: {
        projectId: project.id,
        amount,
        currency: (event.currency ?? "usd").toLowerCase(),
      },
    },
  });

  if (marketerId && isContractApproved) {
    await prisma.notification.create({
      data: {
        userId: marketerId,
        type: "SALE",
        ...notificationMessages.referralSale(
          commissionAmount,
          event.currency ?? "usd",
        ),
        data: {
          projectId: project.id,
          purchaseId: purchase.id,
          commissionAmount,
        },
      },
    });

    const canSendEmail = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL,
    );
    const marketer = await prisma.user.findUnique({
      where: { id: marketerId },
      select: {
        email: true,
        name: true,
        notificationPreference: { select: { emailEnabled: true } },
      },
    });
    const emailEnabled = marketer?.notificationPreference?.emailEnabled;
    const marketerEmail = marketer?.email;

    if (canSendEmail && emailEnabled && marketerEmail) {
      const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

      try {
        void sendEmail({
          to: marketerEmail,
          subject: "New referral sale",
          react: React.createElement(ReferralSaleEmail, {
            name: marketer?.name,
            projectName: project.name ?? "your project",
            commissionAmount,
            currency: event.currency ?? "usd",
            dashboardUrl: `${baseUrl}/marketer/earnings`,
          }),
          text: `New referral sale on ${
            project.name ?? "your project"
          }. Commission ${Math.round(commissionAmount) / 100} ${(event.currency ?? "usd").toUpperCase()}.`,
        }).catch((error) => {
          console.error("Failed to send referral sale email", error);
        });
      } catch (error) {
        console.error("Failed to queue referral sale email", error);
      }
    }
  }

  if (project.userId) {
    await prisma.notification.create({
      data: {
        userId: project.userId,
        type: commissionAmount > 0 ? "COMMISSION_DUE" : "SALE",
        ...(commissionAmount > 0
          ? notificationMessages.commissionDue(
              project.name ?? "your project",
              amount,
              commissionAmount,
              event.currency ?? "usd",
            )
          : notificationMessages.newSale(
              project.name ?? "your project",
              amount,
              event.currency ?? "usd",
            )),
        data: {
          projectId: project.id,
          purchaseId: purchase.id,
          commissionAmount,
        },
      },
    });
  }

  return respond("purchase_created");
}
