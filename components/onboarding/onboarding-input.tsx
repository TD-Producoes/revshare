"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface OnboardingInputProps {
  // Input ID and label text
  id: string;
  label: string;
  // Input value and change handler
  value: string;
  onChange: (value: string) => void;
  // Placeholder text
  placeholder?: string;
  // Optional: auto focus
  autoFocus?: boolean;
  // Optional: input type
  type?: string;
  // Optional: additional className for container
  containerClassName?: string;
  // Optional: additional className for input
  className?: string;
}

/**
 * Styled input component for onboarding forms.
 * Uses the same input styling as FormInput (border-2, focus effects) but with onboarding-specific label styling.
 */
export function OnboardingInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoFocus = false,
  type = "text",
  containerClassName,
  className,
}: OnboardingInputProps) {
  return (
    <div className={cn("grid gap-2", containerClassName)}>
      <Label htmlFor={id} className="text-sm font-semibold text-black">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40 px-6",
          className
        )}
      />
    </div>
  );
}

