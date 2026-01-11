"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { WaitlistModal } from "@/components/modals/waitlist-modal";

interface PreviewBannerProps {
  variant?: "marketer" | "founder";
}

export function PreviewBanner({ variant = "marketer" }: PreviewBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  if (!isVisible) return null;

  const ctaText = variant === "marketer"
    ? "Join the waitlist to be first to apply to programs"
    : "Join the waitlist to publish your program at launch";

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-100">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px] uppercase tracking-widest">
              Preview
            </Badge>
            <p className="text-sm text-amber-900 font-medium">
              <span className="font-bold">RevShare is launching soon.</span>
              {" "}Explore example programs and see how discovery will work.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              size="sm"
              className="h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4"
              onClick={() => setIsWaitlistOpen(true)}
            >
              <Sparkles className="h-3 w-3 mr-1.5" />
              Join Waitlist
            </Button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-amber-600 hover:text-amber-800 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
        source={variant === "marketer" ? "projects-preview" : "marketers-preview"}
      />
    </>
  );
}
