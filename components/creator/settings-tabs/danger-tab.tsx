"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CreatorDangerTab() {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
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
  );
}
