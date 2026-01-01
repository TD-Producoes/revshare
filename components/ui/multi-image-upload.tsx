"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X, Loader2 } from "lucide-react";
import {
  validateImageFile,
  uploadProjectImage,
  deleteProjectImage,
  getPathFromUrl,
} from "@/lib/supabase/storage";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  userId: string;
  projectId: string;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiImageUpload({
  value,
  onChange,
  userId,
  projectId,
  maxImages = 6,
  className,
  disabled = false,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const remainingSlots = maxImages - value.length;
      const filesToUpload = files.slice(0, remainingSlots);

      setError(null);
      for (const file of filesToUpload) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError.message);
          return;
        }
      }

      setIsUploading(true);
      try {
        const newUrls: string[] = [];
        for (let i = 0; i < filesToUpload.length; i++) {
          const result = await uploadProjectImage(
            filesToUpload[i],
            userId,
            projectId,
            "gallery",
            value.length + i
          );
          newUrls.push(result.url);
        }
        onChange([...value, ...newUrls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [value, userId, projectId, maxImages, onChange]
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const url = value[index];
      const path = getPathFromUrl(url);
      if (path) {
        await deleteProjectImage(path).catch(() => {});
      }
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileChange}
        disabled={disabled || isUploading || value.length >= maxImages}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2">
        {value.map((url, index) => (
          <div key={url} className="relative group aspect-video">
            <img
              src={url}
              alt={`Gallery ${index + 1}`}
              className="h-full w-full rounded-lg border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxImages} images
      </p>
    </div>
  );
}
