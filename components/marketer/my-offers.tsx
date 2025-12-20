"use client";

import { useCurrentUser, useOffers } from "@/lib/data/store";
import { MyOffersTable } from "./my-offers-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

export function MyOffers() {
  const currentUser = useCurrentUser();
  const offers = useOffers();

  if (!currentUser || currentUser.role !== "marketer") {
    return null;
  }

  const myOffers = offers.filter((o) => o.marketerId === currentUser.id);
  const approvedOffers = myOffers.filter((o) => o.status === "approved");
  const pendingOffers = myOffers.filter((o) => o.status === "pending");
  const rejectedOffers = myOffers.filter((o) => o.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Offers</h1>
        <p className="text-muted-foreground">
          Track your affiliate partnerships and performance.
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({approvedOffers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingOffers.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 ml-1">
                {pendingOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <MyOffersTable offers={approvedOffers} />
        </TabsContent>

        <TabsContent value="pending">
          {pendingOffers.length === 0 ? (
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
                  {pendingOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">
                          Project: {offer.projectId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied {new Date(offer.createdAt).toLocaleDateString()}
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
          {rejectedOffers.length === 0 ? (
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
                  {rejectedOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-3 border rounded-md opacity-60"
                    >
                      <div>
                        <p className="font-medium">
                          Project: {offer.projectId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied {new Date(offer.createdAt).toLocaleDateString()}
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
      </Tabs>
    </div>
  );
}
