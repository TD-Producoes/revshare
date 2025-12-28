"use client";

import { useMemo } from "react";
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
import { useAuthUserId } from "@/lib/hooks/auth";
import {
  Contract,
  ContractStatus,
  useContractsForCreator,
  useUpdateContractStatus,
} from "@/lib/hooks/contracts";

export function OffersManagement() {
  const { data: creatorId } = useAuthUserId();
  const { data: contracts = [] } = useContractsForCreator(creatorId);
  const updateStatus = useUpdateContractStatus();

  const pendingContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "pending"),
    [contracts],
  );
  const approvedContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "approved"),
    [contracts],
  );
  const rejectedContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "rejected"),
    [contracts],
  );

  const handleApprove = (contractId: string) => {
    if (!creatorId) return;
    updateStatus.mutate({
      contractId,
      creatorId,
      status: "approved",
    });
  };

  const handleReject = (contractId: string) => {
    if (!creatorId) return;
    updateStatus.mutate({
      contractId,
      creatorId,
      status: "rejected",
    });
  };

  const getStatusBadge = (status: ContractStatus) => {
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

  const ContractsTable = ({
    contractsList,
    showActions = false,
  }: {
    contractsList: Contract[];
    showActions?: boolean;
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Marketer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Project</TableHead>
          <TableHead className="text-right">Commission</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {contractsList.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={showActions ? 7 : 6}
              className="text-center py-8 text-muted-foreground"
            >
              No contracts found
            </TableCell>
          </TableRow>
        ) : (
          contractsList.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">
                {contract.userName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contract.userEmail}
              </TableCell>
              <TableCell>{contract.projectName}</TableCell>
              <TableCell className="text-right">
                {contract.commissionPercent}%
              </TableCell>
              <TableCell>{getStatusBadge(contract.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(contract.createdAt).toLocaleDateString()}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => handleApprove(contract.id)}
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleReject(contract.id)}
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
        <h1 className="text-2xl font-bold">Contract Management</h1>
        <p className="text-muted-foreground">
          Review and manage affiliate applications for your projects.
        </p>
      </div>

      {/* Pending offers alert */}
      {pendingContracts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">
                {pendingContracts.length} pending application
                {pendingContracts.length !== 1 ? "s" : ""} require your review
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingContracts.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {pendingContracts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractsTable contractsList={pendingContracts} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approved Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractsTable contractsList={approvedContracts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rejected Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractsTable contractsList={rejectedContracts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractsTable contractsList={contracts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
