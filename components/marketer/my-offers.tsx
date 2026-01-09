"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Pause } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useContractsForMarketer } from "@/lib/hooks/contracts";
import Link from "next/link";
import { MyOffersTable } from "./my-offers-table";

export function MyOffers({
  title = "My Offers",
  description = "Track your affiliate partnerships and performance.",
}: {
  title?: string;
  description?: string;
}) {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: currentUser, isLoading: isUserLoading } = useUser(authUserId);
  const { data: contracts = [], isLoading: isContractsLoading } =
    useContractsForMarketer(currentUser?.id);

  if (isAuthLoading || isUserLoading || isContractsLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "marketer") {
    return (
      <div className="text-muted-foreground">
        This section is only available to marketers.
      </div>
    );
  }

  const approvedContracts = contracts.filter((c) => c.status === "approved");
  const pendingContracts = contracts.filter((c) => c.status === "pending");
  const rejectedContracts = contracts.filter((c) => c.status === "rejected");
  const pausedContracts = contracts.filter((c) => c.status === "paused");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({approvedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingContracts.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 ml-1">
                {pendingContracts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="paused" className="gap-2">
            <Pause className="h-4 w-4" />
            Paused ({pausedContracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {approvedContracts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>You don&apos;t have any active contracts yet.</p>
                <p className="text-sm mt-1">
                  <Link href="/marketer/browse" className="text-primary hover:underline">
                    Browse projects
                  </Link>{" "}
                  to find opportunities.
                </p>
              </CardContent>
            </Card>
          ) : (
            <MyOffersTable contracts={approvedContracts} userId={currentUser.id} />
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingContracts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending applications.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  These applications are awaiting creator approval.
                </p>
                <div className="space-y-2">
                  {pendingContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">
                          Project: {contract.projectName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied {new Date(contract.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedContracts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No rejected applications.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rejected Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rejectedContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 border rounded-md opacity-60"
                    >
                      <div>
                        <p className="font-medium">
                          Project: {contract.projectName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied {new Date(contract.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paused">
          {pausedContracts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No paused partnerships.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paused Partnerships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  These partnerships have been temporarily paused by the creator.
                </p>
                <div className="space-y-2">
                  {pausedContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">
                          Project: {contract.projectName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Commission: {(contract.commissionPercent * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <Pause className="h-3 w-3 mr-1" />
                        Paused
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
