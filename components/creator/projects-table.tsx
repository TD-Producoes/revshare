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

interface ProjectWithMetrics extends Project {
  metrics: ProjectMetrics;
  marketerCount: number;
}

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
            projects.map((project) => (
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
                  <Badge variant="secondary">{project.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(project.price)}
                  {project.pricingModel === "subscription" && (
                    <span className="text-muted-foreground text-xs">/mo</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {project.revSharePercent}%
                </TableCell>
                <TableCell className="text-right">
                  {project.pricingModel === "subscription"
                    ? formatCurrency(project.metrics.mrr)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {project.pricingModel === "subscription"
                    ? formatNumber(project.metrics.activeSubscribers)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(project.metrics.affiliateRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {project.marketerCount}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/creator/projects/${project.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
