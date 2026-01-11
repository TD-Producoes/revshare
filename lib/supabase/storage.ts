import { createClient } from "@/lib/supabase/client";

export const BUCKET_NAME = "project-assets";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
  code?: string;
}

export function validateImageFile(file: File): UploadError | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      message: "File type not allowed. Please use JPEG, PNG, WebP, or GIF.",
      code: "INVALID_TYPE",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: "File too large. Maximum size is 5MB.",
      code: "FILE_TOO_LARGE",
    };
  }
  return null;
}

export async function uploadProjectImage(
  file: File,
  userId: string,
  projectId: string,
  type: "logo" | "gallery",
  index?: number
): Promise<UploadResult> {
  const supabase = createClient();
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";

  const fileName =
    type === "logo"
      ? `logo-${timestamp}.${ext}`
      : `image-${timestamp}-${index ?? 0}.${ext}`;

  const path = `${userId}/${projectId}/${type}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

export async function deleteProjectImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}

export function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/project-assets\/(.+)/
    );
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
