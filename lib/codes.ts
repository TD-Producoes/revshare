import crypto from "crypto";

export function generatePromoCode(prefix = "REV") {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}
