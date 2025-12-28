import Stripe from "stripe";

export function stripeForKey(secretKey: string) {
  return new Stripe(secretKey);
}

export function platformStripe() {
  const secretKey = process.env.PLATFORM_STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PLATFORM_STRIPE_SECRET_KEY is required");
  }

  return stripeForKey(secretKey);
}
