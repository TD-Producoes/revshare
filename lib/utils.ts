import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if waitlist mode is enabled via environment variable.
 * When enabled, signup/login CTAs are replaced with "Claim Early Access".
 * Set NEXT_PUBLIC_WAIT_LIST_MODE=1 to enable waitlist mode.
 */
export function isWaitlistMode(): boolean {
  return process.env.NEXT_PUBLIC_WAIT_LIST_MODE === "1";
}
