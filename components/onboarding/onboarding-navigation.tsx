"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  // Optional: custom next button text
  nextButtonText?: string;
  // Optional: custom final button text
  finalButtonText?: string;
  // Optional: disable next button condition
  disableNext?: boolean;
  // Optional: allow back button on first step (e.g., to go back to role selection)
  allowBackOnFirstStep?: boolean;
}

/**
 * Navigation buttons for onboarding flow.
 * Handles Back and Continue/Finish buttons with consistent styling.
 */
export function OnboardingNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextButtonText = "Continue",
  finalButtonText,
  disableNext = false,
  allowBackOnFirstStep = false,
}: OnboardingNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const shouldHideBack = isFirstStep && !allowBackOnFirstStep;

  return (
    <div className="mt-8 flex items-center justify-between pt-6 border-t border-transparent">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={shouldHideBack}
        className={cn(
          "rounded-2xl h-11 px-8 text-[11px] font-black hover:bg-secondary/30 transition-all shadow-none border-none cursor-pointer",
          shouldHideBack && "invisible"
        )}
      >
        Back
      </Button>

      {/* Next/Finish Button */}
      {!isLastStep ? (
        <Button
          size="lg"
          onClick={onNext}
          disabled={disableNext}
          className="px-10 h-12 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black border-none transition-all hover:scale-105 active:scale-95 shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextButtonText}
        </Button>
      ) : (
        <Button
          size="lg"
          className="px-10 h-12 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black border-none transition-all hover:scale-105 active:scale-95 shadow-none cursor-pointer"
        >
          {finalButtonText || "Continue"}
        </Button>
      )}
    </div>
  );
}

