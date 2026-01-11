"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface FormInputProps {
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
  // Optional: required
  required?: boolean;
  // Optional: additional className for container
  containerClassName?: string;
  // Optional: additional className for input
  className?: string;
  // Optional: hide label
  hideLabel?: boolean;
}

/**
 * Reusable form input component with consistent styling.
 * Matches the signup/login form input style with border-2, focus effects, etc.
 * Can be used in signup, login, and onboarding forms.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      placeholder,
      autoFocus = false,
      type = "text",
      required = false,
      containerClassName,
      className,
      hideLabel = false,
    },
    ref
  ) => {
    return (
      <div className={cn("grid gap-2", containerClassName)}>
        {!hideLabel && (
          <Label htmlFor={id} className="text-sm font-semibold text-black">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-12 rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40",
            className
          )}
        />
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

