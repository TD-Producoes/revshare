"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Ghost } from "lucide-react";

interface VisibilitySettingsProps {
  initialVisibility: "PUBLIC" | "GHOST" | "PRIVATE";
  initialShowMrr?: boolean;
  initialShowRevenue?: boolean;
  initialShowStats?: boolean;
  initialShowAvgCommission?: boolean;
  onSave: (data: {
    visibility: "PUBLIC" | "GHOST" | "PRIVATE";
    showMrr?: boolean;
    showRevenue?: boolean;
    showStats?: boolean;
    showAvgCommission?: boolean;
  }) => Promise<void>;
  type: "project" | "user";
}

export function VisibilitySettings({
  initialVisibility,
  initialShowMrr = true,
  initialShowRevenue = true,
  initialShowStats = true,
  initialShowAvgCommission = true,
  onSave,
  type,
}: VisibilitySettingsProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [showMrr, setShowMrr] = useState(initialShowMrr);
  const [showRevenue, setShowRevenue] = useState(initialShowRevenue);
  const [showStats, setShowStats] = useState(initialShowStats);
  const [showAvgCommission, setShowAvgCommission] = useState(initialShowAvgCommission);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        visibility,
        ...(type === "project" ? { showMrr, showRevenue, showStats, showAvgCommission } : {}),
      });
      toast.success("Privacy settings updated");
    } catch (error) {
      toast.error("Failed to update privacy settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Privacy & Visibility</CardTitle>
        <CardDescription>
          Control how your {type === "project" ? "project" : "profile"} is seen by others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Visibility Mode</Label>
          <RadioGroup
            value={visibility}
            onValueChange={(value) => setVisibility(value as any)}
            className="grid gap-4"
          >
            <div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="PUBLIC" id="v-public" className="mt-1" />
              <Label htmlFor="v-public" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Public
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Visible to everyone. Fully indexed in search and directories.
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="GHOST" id="v-ghost" className="mt-1" />
              <Label htmlFor="v-ghost" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Ghost className="h-4 w-4 text-orange-500" />
                  Ghost
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Identity hidden. {type === "project" ? "Project" : "Your"} name and details are redacted, but stats/aggregate data remain visible.
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="PRIVATE" id="v-private" className="mt-1" />
              <Label htmlFor="v-private" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <EyeOff className="h-4 w-4 text-destructive" />
                  Private
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hidden from public search and directories. Only you can view this.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {type === "project" && visibility !== "PRIVATE" && (
          <>
            <div className="space-y-4 pt-2">
              <Label>Data Display Preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-2 border rounded-md">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Show MRR</p>
                    <p className="text-xs text-muted-foreground">Display Monthly Recurring Revenue on public page.</p>
                  </div>
                  <Switch checked={showMrr} onCheckedChange={setShowMrr} />
                </div>
                <div className="flex items-center justify-between gap-4 p-2 border rounded-md">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Show Gross Revenue</p>
                    <p className="text-xs text-muted-foreground">Display total historical revenue.</p>
                  </div>
                  <Switch checked={showRevenue} onCheckedChange={setShowRevenue} />
                </div>
                <div className="flex items-center justify-between gap-4 p-2 border rounded-md">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Show Other Stats</p>
                    <p className="text-xs text-muted-foreground">Display growth charts, churn, etc.</p>
                  </div>
                  <Switch checked={showStats} onCheckedChange={setShowStats} />
                </div>
                <div className="flex items-center justify-between gap-4 p-2 border rounded-md">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Show Average Commission</p>
                    <p className="text-xs text-muted-foreground">Display average commission percentage on public page.</p>
                  </div>
                  <Switch checked={showAvgCommission} onCheckedChange={setShowAvgCommission} />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
