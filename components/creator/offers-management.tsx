"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Check, XCircle, MoreVertical, Star, Pause, Play } from "lucide-react";
import { useAuthUserId } from "@/lib/hooks/auth";
import {
  Contract,
  ContractStatus,
  useContractsForCreator,
  useUpdateContractStatus,
} from "@/lib/hooks/contracts";
import { useMarketerStats } from "@/lib/hooks/marketer";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TestimonialDialog } from "./testimonial-dialog";

type ContractsTableProps = {
  contractsList: Contract[];
  showActions?: boolean;
  onReview: (contractId: string) => void;
  onOpenTestimonial: (contractId: string) => void;
  onPause: (contractId: string) => void;
  onResume: (contractId: string) => void;
  getStatusBadge: (status: ContractStatus) => React.ReactNode;
};

function ContractsTable({
  contractsList,
  showActions = false,
  onReview,
  onOpenTestimonial,
  onPause,
  onResume,
  getStatusBadge,
}: ContractsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Marketer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Project</TableHead>
          <TableHead className="text-right">Commission</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contractsList.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center py-8 text-muted-foreground"
            >
              No contracts found
            </TableCell>
          </TableRow>
        ) : (
          contractsList.map((contract) => {
            const isApproved = contract.status === "approved";
            const isPaused = contract.status === "paused";
            return (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/founder/affiliates/${contract.userId}`}
                    className="hover:underline"
                  >
                    {contract.userName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contract.userEmail}
                </TableCell>
                <TableCell>{contract.projectName}</TableCell>
                <TableCell className="text-right">
                  {contract.commissionPercent * 100}%
                </TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(contract.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {showActions && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => onReview(contract.id)}
                      >
                        Review
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onOpenTestimonial(contract.id)}
                          disabled={!isApproved}
                        >
                          <Star className="h-4 w-4" />
                          Write testimonial
                        </DropdownMenuItem>
                        {isApproved && (
                          <DropdownMenuItem onClick={() => onPause(contract.id)}>
                            <Pause className="h-4 w-4" />
                            Pause application
                          </DropdownMenuItem>
                        )}
                        {isPaused && (
                          <DropdownMenuItem onClick={() => onResume(contract.id)}>
                            <Play className="h-4 w-4" />
                            Resume application
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export function OffersManagement() {
  const { data: creatorId } = useAuthUserId();
  const { data: contracts = [] } = useContractsForCreator(creatorId);
  const updateStatus = useUpdateContractStatus();
  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [testimonialContractId, setTestimonialContractId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    contractId: string;
    action: "pause" | "resume";
  } | null>(null);
  const selectedContract =
    contracts.find((contract) => contract.id === reviewContractId) ?? null;
  const testimonialContract =
    contracts.find((contract) => contract.id === testimonialContractId) ?? null;
  const confirmContract = confirmAction
    ? contracts.find((contract) => contract.id === confirmAction.contractId) ?? null
    : null;
  const { data: marketerStats, isLoading: isStatsLoading } = useMarketerStats(
    selectedContract?.userId,
  );

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
  const pausedContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "paused"),
    [contracts],
  );

  const handleApprove = (contractId: string) => {
    if (!creatorId) return;
    updateStatus.mutate({
      contractId,
      creatorId,
      status: "approved",
    });
    setReviewContractId(null);
  };

  const handleReject = (contractId: string) => {
    if (!creatorId) return;
    updateStatus.mutate({
      contractId,
      creatorId,
      status: "rejected",
    });
    setReviewContractId(null);
  };

  const handlePause = (contractId: string) => {
    setConfirmAction({ contractId, action: "pause" });
  };

  const handleResume = (contractId: string) => {
    setConfirmAction({ contractId, action: "resume" });
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
          <Badge variant="success" className="gap-1">
            <Check className="h-3 w-3" />
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
      case "paused":
        return (
          <Badge variant="secondary" className="gap-1">
            <Pause className="h-3 w-3" />
            Paused
          </Badge>
        );
    }
  };

  const handleOpenTestimonial = (contractId: string) => {
    setTestimonialContractId(contractId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-muted-foreground">
          Review and manage affiliate applications for your projects.
        </p>
      </div>

      {/* Pending offers alert */}
      {pendingContracts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">
                {pendingContracts.length} pending application
                {pendingContracts.length !== 1 ? "s" : ""} require your review
              </span>
            </div>
            <Link
              href="/founder/affiliates"
              className="mt-2 inline-flex text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Once approved, marketers will appear in Affiliates →
            </Link>
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
          <TabsTrigger value="paused">
            Paused ({pausedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Pending Applications</h3>
            <ContractsTable
              contractsList={pendingContracts}
              showActions={true}
              onReview={setReviewContractId}
              onOpenTestimonial={handleOpenTestimonial}
              onPause={handlePause}
              onResume={handleResume}
              getStatusBadge={getStatusBadge}
            />
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Approved Affiliates</h3>
            <ContractsTable
              contractsList={approvedContracts}
              showActions={false}
              onReview={setReviewContractId}
              onOpenTestimonial={handleOpenTestimonial}
              onPause={handlePause}
              onResume={handleResume}
              getStatusBadge={getStatusBadge}
            />
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Rejected Applications</h3>
            <ContractsTable
              contractsList={rejectedContracts}
              showActions={false}
              onReview={setReviewContractId}
              onOpenTestimonial={handleOpenTestimonial}
              onPause={handlePause}
              onResume={handleResume}
              getStatusBadge={getStatusBadge}
            />
          </div>
        </TabsContent>

        <TabsContent value="paused">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Paused Applications</h3>
            <ContractsTable
              contractsList={pausedContracts}
              showActions={false}
              onReview={setReviewContractId}
              onOpenTestimonial={handleOpenTestimonial}
              onPause={handlePause}
              onResume={handleResume}
              getStatusBadge={getStatusBadge}
            />
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">All Applications</h3>
            <ContractsTable
              contractsList={contracts}
              showActions={false}
              onReview={setReviewContractId}
              onOpenTestimonial={handleOpenTestimonial}
              onPause={handlePause}
              onResume={handleResume}
              getStatusBadge={getStatusBadge}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedContract)}
        onOpenChange={(open) => {
          if (!open) setReviewContractId(null);
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Review application</DialogTitle>
            <DialogDescription>
              {selectedContract
                ? `${selectedContract.userName} · ${selectedContract.projectName}`
                : "Review this application."}
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Requested commission</div>
                <div className="mt-2 text-3xl font-semibold">
                  {formatNumber(selectedContract.commissionPercent * 100)}%
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Project default:{" "}
                  {formatNumber(selectedContract.projectCommissionPercent * 100)}%
                </div>
              </div>

              {Math.abs(
                selectedContract.commissionPercent -
                  selectedContract.projectCommissionPercent,
              ) > 0.0001 && (
                <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100">
                  <AlertTitle className="text-amber-900 dark:text-amber-100">
                    Commission differs from default
                  </AlertTitle>
                  <AlertDescription>
                    This application requests{" "}
                    {formatNumber(selectedContract.commissionPercent * 100)}% instead
                    of the default{" "}
                    {formatNumber(selectedContract.projectCommissionPercent * 100)}%.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Refund window</div>
                <div className="mt-2 text-2xl font-semibold">
                  {selectedContract.refundWindowDays ??
                    selectedContract.projectRefundWindowDays ??
                    0}{" "}
                  days
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Project default:{" "}
                  {selectedContract.projectRefundWindowDays ?? 0} days
                </div>
              </div>

              {selectedContract.refundWindowDays != null &&
                selectedContract.projectRefundWindowDays != null &&
                selectedContract.refundWindowDays !==
                  selectedContract.projectRefundWindowDays && (
                  <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100">
                    <AlertTitle className="text-amber-900 dark:text-amber-100">
                      Refund window differs from default
                    </AlertTitle>
                    <AlertDescription>
                      This application requests{" "}
                      {selectedContract.refundWindowDays} days instead of the
                      default {selectedContract.projectRefundWindowDays} days.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Marketer stats</div>
                {isStatsLoading ? (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Loading stats...
                  </div>
                ) : marketerStats ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total sales
                      </div>
                      <div className="text-lg font-semibold">
                        {formatNumber(marketerStats.totalPurchases)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total revenue
                      </div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(marketerStats.totalRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total earnings
                      </div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(marketerStats.totalEarnings)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Pending earnings
                      </div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(marketerStats.pendingEarnings)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-muted-foreground">
                    No stats available yet.
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Message</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedContract.message?.trim()
                    ? selectedContract.message
                    : "No message provided."}
                </p>
              </div>
            </div>
          )}

          {selectedContract && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewContractId(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleReject(selectedContract.id)}
              >
                Reject
              </Button>
              <Button type="button" onClick={() => handleApprove(selectedContract.id)}>
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmAction)} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "pause"
                ? "Pause this application?"
                : "Resume this application?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "pause"
                ? "The marketer will no longer receive new commissions until this is resumed."
                : "This will re-activate the application and allow commissions to be attributed again."}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {confirmContract
              ? `${confirmContract.userName} · ${confirmContract.projectName}`
              : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={updateStatus.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmAction?.action === "pause" ? "destructive" : "default"}
              onClick={() => {
                if (!confirmAction || !creatorId) return;
                updateStatus.mutate({
                  contractId: confirmAction.contractId,
                  creatorId,
                  status: confirmAction.action === "pause" ? "paused" : "approved",
                });
                setConfirmAction(null);
              }}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending
                ? confirmAction?.action === "pause"
                  ? "Pausing..."
                  : "Resuming..."
                : confirmAction?.action === "pause"
                  ? "Pause application"
                  : "Resume application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <TestimonialDialog
        contract={testimonialContract}
        open={Boolean(testimonialContract)}
        onOpenChange={(open) => {
          if (!open) {
            setTestimonialContractId(null);
          }
        }}
        creatorId={creatorId}
      />
    </div>
  );
}
