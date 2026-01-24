"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/data/metrics";
import type { MarketerPurchase } from "@/lib/hooks/marketer";

type PurchasesTabProps = {
  purchases: MarketerPurchase[];
  currency: string;
  getStatusBadge: (status: string, commissionStatus: string) => React.ReactElement;
};

export function MarketerPurchasesTab({
  purchases,
  currency,
  getStatusBadge,
}: PurchasesTabProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Purchases for this Project</h3>
      {purchases.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No purchases yet for this project.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coupon</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Refund Ends</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>
                  {purchase.couponCode ? (
                    <Badge variant="secondary">{purchase.couponCode}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(purchase.amount, purchase.currency ?? currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    purchase.commissionAmount,
                    purchase.currency ?? currency,
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(purchase.status, purchase.commissionStatus)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {purchase.refundEligibleAt
                    ? new Date(purchase.refundEligibleAt).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(purchase.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
