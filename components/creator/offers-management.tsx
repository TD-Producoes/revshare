"use client";

import {
  useCurrentUser,
  useProjects,
  useOffers,
  useUsers,
  useAppStore,
} from "@/lib/data/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { OfferStatus } from "@/lib/data/types";

export function OffersManagement() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const offers = useOffers();
  const users = useUsers();
  const updateOfferStatus = useAppStore((state) => state.updateOfferStatus);

  if (!currentUser || currentUser.role !== "creator") {
    return null;
  }

  const creatorProjects = projects.filter((p) => p.creatorId === currentUser.id);
  const creatorProjectIds = creatorProjects.map((p) => p.id);

  const allOffers = offers.filter((o) =>
    creatorProjectIds.includes(o.projectId)
  );

  const pendingOffers = allOffers.filter((o) => o.status === "pending");
  const approvedOffers = allOffers.filter((o) => o.status === "approved");
  const rejectedOffers = allOffers.filter((o) => o.status === "rejected");

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown Project";
  };

  const getMarketerName = (marketerId: string) => {
    return users.find((u) => u.id === marketerId)?.name || "Unknown Marketer";
  };

  const getMarketerEmail = (marketerId: string) => {
    return users.find((u) => u.id === marketerId)?.email || "";
  };

  const handleApprove = (offerId: string) => {
    updateOfferStatus(offerId, "approved");
  };

  const handleReject = (offerId: string) => {
    updateOfferStatus(offerId, "rejected");
  };

  const getStatusBadge = (status: OfferStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
    }
  };

  const OffersTable = ({
    offersList,
    showActions = false,
  }: {
    offersList: typeof allOffers;
    showActions?: boolean;
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Marketer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {offersList.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={showActions ? 6 : 5}
              className="text-center py-8 text-muted-foreground"
            >
              No offers found
            </TableCell>
          </TableRow>
        ) : (
          offersList.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">
                {getMarketerName(offer.marketerId)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getMarketerEmail(offer.marketerId)}
              </TableCell>
              <TableCell>{getProjectName(offer.projectId)}</TableCell>
              <TableCell>{getStatusBadge(offer.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(offer.createdAt).toLocaleDateString()}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => handleApprove(offer.id)}
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleReject(offer.id)}
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Offer Management</h1>
        <p className="text-muted-foreground">
          Review and manage affiliate applications for your projects.
        </p>
      </div>

      {/* Pending offers alert */}
      {pendingOffers.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">
                {pendingOffers.length} pending application
                {pendingOffers.length !== 1 ? "s" : ""} require your review
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingOffers.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {pendingOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedOffers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedOffers.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({allOffers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <OffersTable offersList={pendingOffers} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approved Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <OffersTable offersList={approvedOffers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rejected Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <OffersTable offersList={rejectedOffers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <OffersTable offersList={allOffers} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
