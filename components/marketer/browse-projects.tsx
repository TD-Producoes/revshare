"use client";

import { useState } from "react";
import {
  useCurrentUser,
  useProjects,
  useOffers,
  useUsers,
  useAppStore,
} from "@/lib/data/store";
import { formatCurrency } from "@/lib/data/metrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Percent, Timer, Check, Clock } from "lucide-react";

export function BrowseProjects() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const offers = useOffers();
  const users = useUsers();
  const createOffer = useAppStore((state) => state.createOffer);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  if (!currentUser || currentUser.role !== "marketer") {
    return null;
  }

  // Get unique categories
  const categories = [...new Set(projects.map((p) => p.category))];

  // Get my offers for quick lookup
  const myOffers = offers.filter((o) => o.marketerId === currentUser.id);
  const myOfferProjectIds = myOffers.map((o) => o.projectId);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || project.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCreator = (creatorId: string) => {
    return users.find((u) => u.id === creatorId);
  };

  const getOfferStatus = (projectId: string) => {
    const offer = myOffers.find((o) => o.projectId === projectId);
    return offer?.status || null;
  };

  const handleApply = (projectId: string) => {
    createOffer(projectId, currentUser.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse Projects</h1>
        <p className="text-muted-foreground">
          Find products to promote and earn commissions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No projects found matching your criteria.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const creator = getCreator(project.creatorId);
            const offerStatus = getOfferStatus(project.id);

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{project.category}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Percent className="h-3 w-3" />
                      {project.revSharePercent}% rev share
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creator</span>
                      <span className="font-medium">
                        {creator?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {formatCurrency(project.price)}
                        {project.pricingModel === "subscription" && (
                          <span className="text-muted-foreground">/mo</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pricing Model</span>
                      <span className="font-medium capitalize">
                        {project.pricingModel}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        Cookie Window
                      </span>
                      <span className="font-medium">
                        {project.cookieWindowDays} days
                      </span>
                    </div>
                    {project.pricingModel === "subscription" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Public MRR</span>
                        <span className="font-medium">
                          {formatCurrency(project.publicMetrics.mrr)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {offerStatus === "approved" ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled
                    >
                      <Check className="h-4 w-4" />
                      Already Promoting
                    </Button>
                  ) : offerStatus === "pending" ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled
                    >
                      <Clock className="h-4 w-4" />
                      Application Pending
                    </Button>
                  ) : offerStatus === "rejected" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Application Rejected
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleApply(project.id)}
                    >
                      Apply to Promote
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
