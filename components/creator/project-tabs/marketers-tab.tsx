"use client";

import Link from "next/link";

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
import { formatCurrency, formatNumber } from "@/lib/data/metrics";

type AffiliateRow = {
  marketerId: string;
  marketerName: string;
  referralCode: string;
  purchases: number;
  revenue: number;
  commission: number;
};

export function ProjectMarketersTab({
  affiliateRows,
  isLoading,
  error,
}: {
  affiliateRows: AffiliateRow[];
  isLoading: boolean;
  error?: Error | null;
}) {
  const getCommissionOwed = (earnings: number) => earnings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Affiliate Marketers</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            Loading affiliate marketers...
          </p>
        ) : affiliateRows.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No marketers are promoting this project yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marketer</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Signups</TableHead>
                <TableHead className="text-right">Paid Customers</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
                <TableHead className="text-right">MRR Attributed</TableHead>
                <TableHead className="text-right">Commission Owed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliateRows.map((row) => (
                <TableRow key={row.marketerId}>
                  <TableCell className="font-medium">
                    <Link
                      className="hover:underline"
                      href={`/creator/marketers/${row.marketerId}`}
                    >
                      {row.marketerName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {row.referralCode}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.purchases)}
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(getCommissionOwed(row.commission))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {error ? (
          <p className="text-sm text-destructive mt-4">
            {error instanceof Error ? error.message : "Unable to load marketers."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
