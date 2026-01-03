"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getStatusBadge: (status: string, commissionStatus: string) => JSX.Element;
};

export function MarketerPurchasesTab({
  purchases,
  currency,
  getStatusBadge,
}: PurchasesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchases for this Project</CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No purchases yet for this project.
          </p>
        ) : (
          <div className="rounded-md border">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
