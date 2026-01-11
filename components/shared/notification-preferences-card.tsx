"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!data?.data || isDirty) return;
    setEmailEnabled(Boolean(data.data.emailEnabled));
    setWebhookEnabled(Boolean(data.data.webhookEnabled));
    setWebhookUrl(data.data.webhookUrl ?? "");
  }, [data?.data, isDirty]);

  const hasChanges = useMemo(() => {
    if (!data?.data) return isDirty;
    return (
      emailEnabled !== Boolean(data.data.emailEnabled) ||
      webhookEnabled !== Boolean(data.data.webhookEnabled) ||
      webhookUrl.trim() !== (data.data.webhookUrl ?? "")
    );
  }, [data?.data, emailEnabled, webhookEnabled, webhookUrl, isDirty]);

  const handleSave = async () => {
    setSaveError(null);
    try {
      await updatePreferences.mutateAsync({
        userId,
        emailEnabled,
        webhookEnabled,
        webhookUrl: webhookUrl.trim() ? webhookUrl.trim() : null,
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
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Webhook delivery</p>
              <p className="text-sm text-muted-foreground">
                Send notifications to your own system.
              </p>
            </div>
            <Switch
              checked={webhookEnabled}
              onCheckedChange={(value) => {
                setWebhookEnabled(value);
                setIsDirty(true);
              }}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://example.com/webhooks/revshare"
              value={webhookUrl}
              onChange={(event) => {
                setWebhookUrl(event.target.value);
                setIsDirty(true);
              }}
              disabled={!webhookEnabled || isLoading}
            />
          </div>
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
