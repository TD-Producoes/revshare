"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Loader2, ImageIcon } from "lucide-react";
import {
  validateImageFile,
  uploadProjectImage,
  deleteProjectImage,
  getPathFromUrl,
} from "@/lib/supabase/storage";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  projectId: string;
  type: "logo" | "gallery";
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  userId,
  projectId,
  type,
  className,
  disabled = false,
  placeholder = "Upload image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError.message);
        return;
      }

      setIsUploading(true);
      try {
        // Delete old image if exists
        if (value) {
          const oldPath = getPathFromUrl(value);
          if (oldPath) {
            await deleteProjectImage(oldPath).catch(() => {});
          }
        }

        const result = await uploadProjectImage(file, userId, projectId, type);
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [value, userId, projectId, type, onChange]
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;

    const path = getPathFromUrl(value);
    if (path) {
      await deleteProjectImage(path).catch(() => {});
    }
    onChange(null);
  }, [value, onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <div className="relative group inline-block">
          <img
            src={value}
            alt="Uploaded"
            className={cn(
              "rounded-lg object-cover",
              type === "logo" ? "h-24 w-24" : "h-32 w-full"
            )}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed",
            "hover:border-primary/50 hover:bg-muted/50 transition-colors",
            "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            type === "logo" ? "h-24 w-24" : "h-32 w-full"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">
                {placeholder}
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
