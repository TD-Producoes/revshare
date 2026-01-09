export const notificationMessages = {
  contractApplied: (marketerName: string, projectName: string) => ({
    title: "New marketer application",
    message: `${marketerName} applied to ${projectName}.`,
  }),
  contractApproved: (projectName: string) => ({
    title: "Project application approved",
    message: `${projectName} approved your application.`,
  }),
  contractRejected: (projectName: string) => ({
    title: "Project application rejected",
    message: `${projectName} rejected your application.`,
  }),
  contractPaused: (projectName: string) => ({
    title: "Partnership paused",
    message: `${projectName} has temporarily paused your partnership.`,
  }),
  contractResumed: (projectName: string) => ({
    title: "Partnership resumed",
    message: `${projectName} has resumed your partnership.`,
  }),
  couponClaimed: (marketerName: string, templateName: string, projectName: string) => ({
    title: "New marketer promo code",
    message: `${marketerName} claimed ${templateName} for ${projectName}.`,
  }),
  payoutInvoiceCreated: () => ({
    title: "Payout invoice created",
    message: "Your affiliate payout invoice is ready to be paid.",
  }),
  payoutInvoicePaid: () => ({
    title: "Payment received",
    message: "Your payout invoice has been paid. Marketer transfers can now be processed.",
  }),
  payoutSent: (amount: number, currency: string) => ({
    title: "Payout sent",
    message: `A payout of ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} has been sent.`,
  }),
  payoutFailed: (failureReason: string) => ({
    title: "Payout failed",
    message: failureReason,
  }),
  referralSale: (commissionAmount: number, currency: string) => ({
    title: "New referral sale",
    message: `You earned ${Math.round(commissionAmount) / 100} ${currency.toUpperCase()} in commission.`,
  }),
  commissionDue: (
    projectName: string,
    amount: number,
    commissionAmount: number,
    currency: string,
  ) => ({
    title: "Commission due",
    message: `Sale ${Math.round(amount) / 100} ${currency.toUpperCase()} · Commission ${Math.round(commissionAmount) / 100} ${currency.toUpperCase()} for ${projectName}.`,
  }),
  newSale: (projectName: string, amount: number, currency: string) => ({
    title: "New sale",
    message: `Sale ${Math.round(amount) / 100} ${currency.toUpperCase()} for ${projectName}.`,
  }),
  refundRecorded: (
    projectName: string,
    refundedAmount: number,
    commissionAmount: number,
    currency: string,
  ) => ({
    title: "Refund recorded",
    message: `Refund ${Math.round(refundedAmount) / 100} ${currency.toUpperCase()} for ${projectName}. Commission now ${Math.round(commissionAmount) / 100} ${currency.toUpperCase()}.`,
  }),
  chargebackCreated: (projectName: string, amount: number, currency: string) => ({
    title: "Chargeback opened",
    message: `Chargeback opened for ${projectName} (${Math.round(amount) / 100} ${currency.toUpperCase()}). Commission is on hold.`,
  }),
  chargebackResolved: (projectName: string, amount: number, currency: string) => ({
    title: "Chargeback resolved",
    message: `Chargeback resolved for ${projectName} (${Math.round(amount) / 100} ${currency.toUpperCase()}).`,
  }),
  couponTemplateCreated: (templateName: string, projectName: string) => ({
    title: "New coupon template",
    message: `${templateName} is now available for ${projectName}.`,
  }),
  rewardUnlocked: (rewardName: string, projectName: string) => ({
    title: "Reward unlocked",
    message: `${rewardName} is now unlocked for ${projectName}.`,
  }),
  rewardClaimedMarketer: (rewardName: string, projectName: string) => ({
    title: "Reward claimed",
    message: `You claimed ${rewardName} for ${projectName}.`,
  }),
  rewardClaimed: (marketerName: string, rewardName: string, projectName: string) => ({
    title: "Reward claimed",
    message: `${marketerName} claimed ${rewardName} for ${projectName}.`,
  }),
};
