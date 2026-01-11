"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface OnboardingStepWrapperProps {
  // Current step number (for animation key)
  currentStep: number;
  // Step content
  children: ReactNode;
}

/**
 * Wrapper component for step content with consistent animations.
 * Handles fade and slide transitions between steps.
 */
export function OnboardingStepWrapper({
  currentStep,
  children,
}: OnboardingStepWrapperProps) {
  return (
    <div className="flex flex-1 flex-col justify-center px-8 py-6 lg:px-20 border-none">
      <div className="mx-auto w-full max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

