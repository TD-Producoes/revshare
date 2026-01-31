"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project, ProjectMetrics } from "@/lib/data/types";
import { formatCurrency, formatNumber } from "@/lib/data/metrics";
import { ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithMetrics | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (project: ProjectWithMetrics) => {
    setProjectToDelete(project);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || confirmText !== "delete") return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["creator-dashboard"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Rev Share</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead className="text-right">Customers</TableHead>
            <TableHead className="text-right">Affiliate Revenue</TableHead>
            <TableHead className="text-right">Marketers</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No projects yet. Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => {
              const hasRevShare =
                typeof project.revSharePercent === "number" &&
                Number.isFinite(project.revSharePercent);
              const hasMetrics = Boolean(project.metrics);
              const hasMarketers = typeof project.marketerCount === "number";

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/founder/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasRevShare ? `${project.revSharePercent}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasMetrics ? formatCurrency(project.metrics!.mrr) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasMetrics
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/founder/projects/${project.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteClick(project)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{projectToDelete?.name}</span> and
              all associated data including contracts, coupons, purchases, rewards,
              and metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-semibold">delete</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={confirmText !== "delete" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
