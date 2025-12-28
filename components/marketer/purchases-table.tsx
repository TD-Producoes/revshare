"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/data/metrics";
import { MarketerPurchase } from "@/lib/hooks/marketer";

interface PurchasesTableProps {
  purchases: MarketerPurchase[];
  limit?: number;
}

export function PurchasesTable({ purchases, limit }: PurchasesTableProps) {
  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No purchases yet. Your coupon sales will appear here.
        </CardContent>
      </Card>
    );
  }

  const displayPurchases = limit ? purchases.slice(0, limit) : purchases;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Coupon</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayPurchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell className="font-medium">
                {purchase.projectName}
              </TableCell>
              <TableCell>
                {purchase.couponCode ? (
                  <Badge variant="secondary">{purchase.couponCode}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(purchase.amount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(purchase.commissionAmount)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {purchase.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {new Date(purchase.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
