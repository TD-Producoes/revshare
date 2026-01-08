"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileSettings } from "@/components/profile-settings";

type AccountTabProps = {
  name: string;
  email: string;
  role: string;
  profileUser: {
    id: string;
    name: string;
    email: string;
    role: "creator" | "marketer";
  };
};

export function CreatorAccountTab({
  name,
  email,
  role,
  profileUser,
}: AccountTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge className="capitalize">{role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileSettings user={profileUser} />
    </div>
  );
}
