"use client";

import { useMemo } from "react";
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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type EventRow = {
  id: string;
  type: string;
  createdAt: string;
  actor: { id: string; name: string | null; email: string | null } | null;
  project: { id: string; name: string | null } | null;
  data: JsonValue;
};

function formatEventType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (m) => m.toUpperCase());
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().replace(".000Z", "Z");
}

function getObject(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, JsonValue>;
}

function initiatedByLabel(data: JsonValue): string | null {
  const obj = getObject(data);
  const rev = obj ? getObject(obj.revclaw ?? null) : null;
  const v = rev?.initiatedBy;
  if (v === "agent") return "BOT";
  if (v === "user") return "USER";
  return null;
}

function detailsPreview(data: JsonValue) {
  const obj = getObject(data);
  if (!obj) return "-";
  const entries = Object.entries(obj)
    .filter(([k, v]) => k !== "revclaw" && v !== null && v !== undefined)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`);
  return entries.length ? entries.join(" · ") : "-";
}

export function BotActivity({ installationId }: { installationId: string }) {
  const { data, isLoading, error } = useQuery<{ data: EventRow[] }>({
    queryKey: ["revclaw-installation-events", installationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/revclaw/installations/${installationId}/events?limit=40`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load events");
      return json;
    },
  });

  const events = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <div className="space-y-3">
      <div className="flex flex-row items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Activity</h3>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading events...</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Unable to load events"}
        </p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No events yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Via</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const via = initiatedByLabel(event.data);
              return (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(event.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatEventType(event.type)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.project?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.actor?.name ?? event.actor?.email ?? "-"}
                  </TableCell>
                  <TableCell>
                    {via ? (
                      <Badge
                        variant={via === "BOT" ? "secondary" : "outline"}
                        className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {via}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {detailsPreview(event.data)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
