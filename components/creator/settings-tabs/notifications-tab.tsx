"use client";

import { NotificationPreferencesCard } from "@/components/shared/notification-preferences-card";

export function CreatorNotificationsTab({ userId }: { userId: string }) {
  return <NotificationPreferencesCard userId={userId} />;
}
