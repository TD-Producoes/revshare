"use client";

import Link from "next/link";
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
import { Project, ProjectMetrics } from "@/lib/data/types";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { ExternalLink } from "lucide-react";

type ProjectWithMetrics = Partial<Project> & {
  id: string;
  name: string;
  metrics?: ProjectMetrics | null;
  marketerCount?: number | null;
};

interface ProjectsTableProps {
  projects: ProjectWithMetrics[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Rev Share</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead className="text-right">Subscribers</TableHead>
            <TableHead className="text-right">Affiliate Revenue</TableHead>
            <TableHead className="text-right">Marketers</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No projects yet. Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => {
              const hasPrice =
                typeof project.price === "number" &&
                Number.isFinite(project.price);
              const hasRevShare =
                typeof project.revSharePercent === "number" &&
                Number.isFinite(project.revSharePercent);
              const hasMetrics = Boolean(project.metrics);
              const isSubscription = project.pricingModel === "subscription";
              const hasMarketers = typeof project.marketerCount === "number";

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/creator/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {project.category ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasPrice ? formatCurrency(project.price!) : "-"}
                    {hasPrice && isSubscription && (
                      <span className="text-muted-foreground text-xs">/mo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasRevShare ? `${project.revSharePercent}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSubscription && hasMetrics
                      ? formatCurrency(project.metrics!.mrr)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSubscription && hasMetrics
                      ? formatNumber(project.metrics!.activeSubscribers)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasMetrics
                      ? formatCurrency(project.metrics!.affiliateRevenue)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasMarketers ? project.marketerCount : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/creator/projects/${project.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
