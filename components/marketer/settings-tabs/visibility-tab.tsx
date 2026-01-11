"use client";

import { VisibilitySettings } from "@/components/shared/visibility-settings";

type VisibilityTabProps = {
  visibility: "PUBLIC" | "GHOST" | "PRIVATE";
  onSave: (data: { visibility: "PUBLIC" | "GHOST" | "PRIVATE" }) => Promise<void>;
};

export function MarketerVisibilityTab({ visibility, onSave }: VisibilityTabProps) {
  return (
    <VisibilitySettings
      initialVisibility={visibility}
      onSave={onSave}
      type="user"
    />
  );
}
