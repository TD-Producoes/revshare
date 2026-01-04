"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function CreatorPayoutsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payout Settings</CardTitle>
        <CardDescription>
          Configure how affiliate commissions are paid out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Payout Schedule</Label>
          <p className="text-sm text-muted-foreground">
            Affiliates are paid on the 1st of each month for the previous
            month&apos;s earnings.
          </p>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>Minimum Payout</Label>
          <p className="text-sm text-muted-foreground">
            $50.00 minimum before payout is processed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
