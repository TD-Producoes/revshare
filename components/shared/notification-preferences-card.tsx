"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/hooks/notifications";

type NotificationPreferencesCardProps = {
  userId: string;
};

export function NotificationPreferencesCard({
  userId,
}: NotificationPreferencesCardProps) {
  const { data, isLoading } = useNotificationPreferences(userId);
  const updatePreferences = useUpdateNotificationPreferences();
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!data?.data || isDirty) return;
    setEmailEnabled(Boolean(data.data.emailEnabled));
  }, [data?.data, isDirty]);

  const hasChanges = useMemo(() => {
    if (!data?.data) return isDirty;
    return emailEnabled !== Boolean(data.data.emailEnabled);
  }, [data?.data, emailEnabled, isDirty]);

  const handleSave = async () => {
    setSaveError(null);
    try {
      await updatePreferences.mutateAsync({
        userId,
        emailEnabled,
        webhookEnabled: data?.data?.webhookEnabled ?? false,
        webhookUrl: data?.data?.webhookUrl ?? null,
      });
      setIsDirty(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save preferences.";
      setSaveError(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Delivery</CardTitle>
        <CardDescription>
          Choose how you want to receive important updates from RevShare.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveError ? (
          <p className="text-sm text-destructive">{saveError}</p>
        ) : null}
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <p className="font-medium">Email alerts</p>
            <p className="text-sm text-muted-foreground">
              Receive sales, payouts, and commission updates by email.
            </p>
          </div>
          <Switch
            checked={emailEnabled}
            onCheckedChange={(value) => {
              setEmailEnabled(value);
              setIsDirty(true);
            }}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updatePreferences.isPending}
          >
            {updatePreferences.isPending ? "Saving..." : "Save preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
