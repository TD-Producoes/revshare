"use client";

import { motion } from "framer-motion";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Progress bar and step counter component.
 * Shows visual progress through the onboarding flow.
 */
export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="flex h-16 items-center justify-between border-none">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
          R
        </div>
        <span className="font-black tracking-tight text-sm">RevShare</span>
      </div>

      {/* Progress bar and step counter */}
      <div className="flex flex-1 items-center justify-start gap-4 max-w-sm">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50 border-none">
          <motion.div
            className="h-full bg-primary border-none"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-black tabular-nums text-muted-foreground">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
