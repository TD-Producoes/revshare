"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

type PlanRow = {
  id: string;
  status: string;
  planHash: string;
  createdAt: string;
  executedAt: string | null;
  executeIntentId: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().replace(".000Z", "Z");
}

function statusVariant(status: string): "success" | "warning" | "destructive" | "outline" {
  if (status === "APPROVED" || status === "EXECUTED") return "success";
  if (status === "EXECUTING") return "warning";
  if (status === "CANCELED") return "destructive";
  return "outline";
}

export function BotPlans({ installationId }: { installationId: string }) {
  const { data, isLoading, error } = useQuery<{ data: PlanRow[] }>({
    queryKey: ["revclaw-installation-plans", installationId],
    queryFn: async () => {
      const res = await fetch(`/api/revclaw/installations/${installationId}/plans`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load plans");
      return json;
    },
  });

  const plans = data?.data ?? [];

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-row items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Plans</h3>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading plans...</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Unable to load plans"}
        </p>
      ) : plans.length === 0 ? (
        <p className="text-muted-foreground">No plans yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Executed</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant(p.status)}
                    className="uppercase tracking-wide"
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(p.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(p.executedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Plan actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/revclaw/plans/${p.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View plan
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopy(p.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy plan id
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
