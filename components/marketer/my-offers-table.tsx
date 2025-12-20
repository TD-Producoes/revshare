"use client";

import {
  useProjects,
  useEvents,
  useUsers,
  useCurrentUser,
} from "@/lib/data/store";
import {
  getMarketerProjectMetrics,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/data/metrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ExternalLink } from "lucide-react";
import { Offer } from "@/lib/data/types";
import Link from "next/link";

interface MyOffersTableProps {
  offers: Offer[];
  limit?: number;
}

export function MyOffersTable({ offers, limit }: MyOffersTableProps) {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const events = useEvents();
  const users = useUsers();

  if (!currentUser) return null;

  const displayOffers = limit ? offers.slice(0, limit) : offers;

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const getCreator = (creatorId: string) => {
    return users.find((u) => u.id === creatorId);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>You don&apos;t have any active offers yet.</p>
          <p className="text-sm mt-1">
            <Link href="/marketer/browse" className="text-primary hover:underline">
              Browse projects
            </Link>{" "}
            to find opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Rev Share</TableHead>
              <TableHead>Referral Link</TableHead>
              <TableHead>Coupon</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayOffers.map((offer) => {
              const project = getProject(offer.projectId);
              const creator = getCreator(offer.creatorId);

              if (!project) return null;

              const metrics = getMarketerProjectMetrics(
                events,
                project,
                currentUser.id
              );

              return (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {project.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {creator?.name || "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    {project.revSharePercent}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-[150px]">
                        {offer.referralLink}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(offer.referralLink)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {offer.referralCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(offer.referralCode)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(metrics.clicks)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(metrics.paidCustomers)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(metrics.mrr)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(metrics.earnings)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {limit && offers.length > limit && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/marketer/offers">
              View All Offers ({offers.length})
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
