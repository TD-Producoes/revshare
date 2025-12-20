"use client";

import { useCurrentUser } from "@/lib/data/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const currentUser = useCurrentUser();

  if (!currentUser || currentUser.role !== "creator") {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={currentUser.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={currentUser.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge className="capitalize">{currentUser.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stripe Connection</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser.stripeConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Stripe Connected</span>
              </div>
              <Button variant="outline" size="sm">
                Manage
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Stripe account to start receiving affiliate
                payments and manage payouts.
              </p>
              <Button>Connect Stripe Account</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Settings */}
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

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This action cannot be undone. All your projects and data will be
            permanently deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
