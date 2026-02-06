"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvitationRow = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  commissionPercentSnapshot: string | number;
  refundWindowDaysSnapshot: number;
  createdAt: string;
  project: { id: string; name: string };
  founder: { id: string; name: string | null; email: string | null };
  _count: { messages: number };
};

function statusVariant(status: InvitationRow["status"]) {
  if (status === "PENDING") return "warning";
  if (status === "ACCEPTED") return "success";
  if (status === "DECLINED") return "secondary";
  return "destructive";
}

function percentDisplay(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "-";
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

export function InvitationsInbox() {
  const [status, setStatus] = useState<"all" | InvitationRow["status"]>("all");

  const { data, isLoading, error } = useQuery<{ data: InvitationRow[] }>({
    queryKey: ["marketer-invitations", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/marketer/invitations?${params.toString()}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load invitations");
      return json;
    },
  });

  const invitations = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">
            Invitations from founders to join projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href="/marketer/projects">Browse projects</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading invitations...</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load invitations"}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Refund window</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="text-right">Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No invitations yet.
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/marketer/invitations/${inv.id}`}
                      className="hover:underline"
                    >
                      {inv.project.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status)} className="uppercase">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {percentDisplay(inv.commissionPercentSnapshot)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.refundWindowDaysSnapshot}d
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.founder.name ?? inv.founder.email ?? inv.founder.id}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {inv._count?.messages ?? 0}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
