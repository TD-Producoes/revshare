"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SelectableCardProps {
  // Whether this card is selected
  selected: boolean;
  // Callback when card is clicked
  onClick: () => void;
  // Background color class (e.g., "bg-blue-50/50")
  color?: string;
  // Card content
  children: ReactNode;
  // Additional className
  className?: string;
  // Height class (default: auto)
  height?: string;
}

/**
 * Reusable selectable card component for onboarding choices.
 * Handles selection state, hover effects, and consistent styling.
 */
export function SelectableCard({
  selected,
  onClick,
  color = "bg-secondary/20",
  children,
  className,
  height = "auto",
}: SelectableCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 border-none rounded-2xl shadow-none ring-0",
        color,
        selected
          ? "bg-primary/30"
          : "hover:bg-primary/10",
        className
      )}
      style={{ height }}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

