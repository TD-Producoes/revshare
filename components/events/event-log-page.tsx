"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { useEventLog } from "@/lib/hooks/events";
import { useProjects } from "@/lib/hooks/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EventLogPageProps = {
  expectedRole?: "founder" | "marketer";
  title?: string;
};

function formatEventType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (match) => match.toUpperCase());
}

function formatEventDetails(details: Record<string, unknown> | null | undefined) {
  if (!details) return "-";
  const currency =
    typeof details.currency === "string" ? details.currency.toUpperCase() : null;
  const isMoneyKey = (key: string) =>
    /amount|fee|total|commission/i.test(key);
  const formatMoney = (value: number) => {
    const normalized = value / 100;
    if (currency) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(normalized);
    }
    return normalized.toFixed(2);
  };
  const entries = Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => {
      if (typeof value === "number" && isMoneyKey(key)) {
        return `${key}: ${formatMoney(value)}`;
      }
      return `${key}: ${String(value)}`;
    });
  return entries.length > 0 ? entries.join(" · ") : "-";
}

export function EventLogPage({ expectedRole, title }: EventLogPageProps) {
  const { data: authUserId, isLoading: isAuthLoading } = useAuthUserId();
  const { data: user, isLoading: isUserLoading } = useUser(authUserId);
  const { data: projects = [] } = useProjects(
    user?.role === "founder" ? user?.id : null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterMode, setFilterMode] = useState<"actor" | "project">("actor");
  const [actorQuery, setActorQuery] = useState("");
  const [projectId, setProjectId] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");

  const { data: log, isLoading } = useEventLog({
    userId: user?.id,
    role: expectedRole,
    projectId: projectId === "all" ? null : projectId,
    actor: filterMode === "actor" ? actorQuery : undefined,
    eventType: eventType === "all" ? undefined : eventType,
    page,
    pageSize,
  });

  const events = log?.data ?? [];
  const totalCount = log?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pageRange = useMemo(() => {
    if (totalCount === 0) {
      return { start: 0, end: 0 };
    }
    return {
      start: (page - 1) * pageSize + 1,
      end: Math.min(totalCount, page * pageSize),
    };
  }, [page, pageSize, totalCount]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [projectId, actorQuery, pageSize, eventType, filterMode]);

  const projectOptions = useMemo(() => {
    if (user?.role === "founder" && projects.length > 0) {
      return projects.map((project) => ({
        id: project.id,
        name: project.name,
      }));
    }
    const options = new Map<string, string>();
    events.forEach((event) => {
      if (event.project?.id) {
        options.set(event.project.id, event.project.name ?? event.project.id);
      }
    });
    return Array.from(options.entries()).map(([id, name]) => ({ id, name }));
  }, [events, projects, user?.role]);

  const eventTypeOptions = useMemo(() => {
    const types = new Set<string>();
    events.forEach((event) => types.add(event.type));
    return Array.from(types).sort();
  }, [events]);

  if (isAuthLoading || isUserLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-muted-foreground">
        Please sign in to view the audit log.
      </div>
    );
  }

  if (expectedRole && user.role !== expectedRole) {
    return (
      <div className="text-muted-foreground">
        This section is only available to {expectedRole}s.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {title ?? "Audit Log"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Review key activity across your account and projects.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(260px,1fr)_minmax(200px,1fr)]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={filterMode}
                    onValueChange={(value) =>
                      setFilterMode(value as "actor" | "project")
                    }
                  >
                    <SelectTrigger className="relative w-[170px] pl-9">
                      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actor">Actor</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterMode === "actor" ? (
                    <Input
                      className="flex-1"
                      placeholder="Search by name or email"
                      value={actorQuery}
                      onChange={(event) => setActorQuery(event.target.value)}
                    />
                  ) : (
                    <Select
                      value={projectId}
                      onValueChange={(value) => setProjectId(value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="All projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All projects</SelectItem>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Select
                  value={eventType}
                  onValueChange={(value) => setEventType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {eventTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEventType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity found yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {formatEventType(event.type)}
                    </TableCell>
                    <TableCell>
                      {event.project?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      {event.actor?.name ?? "System"}
                      {event.actor?.email ? (
                        <p className="text-xs text-muted-foreground">
                          {event.actor.email}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.subjectType ? (
                        <Badge variant="outline" className="capitalize">
                          {event.subjectType}
                        </Badge>
                      ) : (
                        "-"
                      )}
                      {event.subjectId ? (
                        <p className="text-xs text-muted-foreground">
                          {event.subjectId}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatEventDetails(event.data)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {totalCount === 0
              ? "Showing 0-0 of 0"
              : `Showing ${pageRange.start}-${pageRange.end} of ${totalCount}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
