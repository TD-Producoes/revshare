"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturesInputProps {
  value: string[];
  onChange: (features: string[]) => void;
  maxFeatures?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FeaturesInput({
  value,
  onChange,
  maxFeatures = 10,
  placeholder = "Add a feature...",
  className,
  disabled = false,
}: FeaturesInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addFeature = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxFeatures) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  }, [inputValue, value, maxFeatures, onChange]);

  const removeFeature = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addFeature();
      }
    },
    [addFeature]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || value.length >= maxFeatures}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addFeature}
          disabled={
            disabled || !inputValue.trim() || value.length >= maxFeatures
          }
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((feature, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1">
              {feature}
              <button
                type="button"
                onClick={() => removeFeature(index)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length}/{maxFeatures} features
      </p>
    </div>
  );
}
