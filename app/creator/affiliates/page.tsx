"use client";

import Link from "next/link";

import { useAuthUserId } from "@/lib/hooks/auth";
import { useCreatorMarketers } from "@/lib/hooks/creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";

export default function CreatorAffiliatesPage() {
  const { data: authUserId } = useAuthUserId();
  const { data: marketers = [], isLoading } = useCreatorMarketers(authUserId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Affiliates</h1>
        <p className="text-muted-foreground">
          Review performance across all affiliates promoting your projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">
              Loading affiliates...
            </p>
          ) : marketers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No affiliates yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Affiliate Revenue</TableHead>
                  <TableHead className="text-right">Commission Owed</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketers.map((marketer) => (
                  <TableRow key={marketer.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/creator/affiliates/${marketer.id}`}
                      >
                        {marketer.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {marketer.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(marketer.projectCount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(marketer.affiliateRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(marketer.commissionOwed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(marketer.purchasesCount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(marketer.customersCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

