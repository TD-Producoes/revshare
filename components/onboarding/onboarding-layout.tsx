"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingLayoutProps {
  // Left panel content (value prop)
  leftPanelContent: ReactNode;
  // Right panel content (form)
  rightPanelContent: ReactNode;
  // Current step for animations
  currentStep: number;
}

/**
 * Shared layout component for onboarding pages.
 * Provides the two-panel structure: left panel for value props, right panel for form content.
 */
export function OnboardingLayout({
  leftPanelContent,
  rightPanelContent,
  currentStep,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Left Panel: Value Prop */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary/5 p-12 lg:flex border-none">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
              R
            </div>
            <span className="text-xl font-black tracking-tight">RevShare</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-md"
            >
              {leftPanelContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="flex w-full flex-col lg:w-1/2 border-none">
        {rightPanelContent}
      </div>
    </div>
  );
}

