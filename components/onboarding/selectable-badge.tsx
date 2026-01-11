"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SelectableBadgeProps {
  // Badge text
  label: string;
  // Whether this badge is selected
  selected: boolean;
  // Callback when badge is clicked
  onClick: () => void;
  // Optional: additional className
  className?: string;
}

/**
 * Reusable selectable badge component for onboarding choices.
 * Used for multi-select options like product types or tags.
 */
export function SelectableBadge({
  label,
  selected,
  onClick,
  className,
}: SelectableBadgeProps) {
  return (
    <Badge
      className={cn(
        "cursor-pointer px-5 py-2.5 text-[11px] font-black transition-all duration-300 select-none border-none rounded-full shadow-none",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary/40 hover:bg-secondary/60 text-secondary-foreground",
        className
      )}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}

