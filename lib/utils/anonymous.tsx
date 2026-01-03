import { EyeOff } from "lucide-react";
import { ReactNode } from "react";

/**
 * Checks if a name represents an anonymous entity (null, undefined, or starts with "Anonymous")
 * @param name - The name to check (can be string | null | undefined)
 * @returns true if the name is anonymous, false otherwise
 */
export function isAnonymousName(name: string | null | undefined): boolean {
  if (!name) return true;
  return name.trim().toLowerCase().startsWith("anonymous");
}

/**
 * Gets the appropriate avatar fallback content for a name.
 * Returns an EyeOff icon if the name is anonymous, otherwise returns the first character.
 * @param name - The name to get fallback for (can be string | null | undefined)
 * @param className - Optional className for the EyeOff icon
 * @returns ReactNode - Either an EyeOff icon or a string with the first character
 */
export function getAvatarFallback(
  name: string | null | undefined,
  className?: string
): ReactNode {
  if (isAnonymousName(name)) {
    return <EyeOff className={`h-5 w-5 text-muted-foreground ${className || ""}`} />;
  }
  return name?.charAt(0) || "?";
}

/**
 * Gets the initials from a name (first letter of each word, up to 2 characters).
 * Returns empty string if name is anonymous.
 * @param name - The name to get initials from (can be string | null | undefined)
 * @returns string - The initials or empty string if anonymous
 */
export function getInitials(name: string | null | undefined): string {
  if (isAnonymousName(name) || !name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

