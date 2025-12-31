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
  commissionDue: (projectName: string) => ({
    title: "Commission due",
    message: `A new referral sale was recorded for ${projectName}.`,
  }),
};
