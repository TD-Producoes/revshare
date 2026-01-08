"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectRow = {
  id: string;
  name: string;
  currency?: string | null;
};

type ProjectsTabProps = {
  projects: ProjectRow[];
  isLoading: boolean;
  savingCurrencyId: string | null;
  currencyError: string | null;
  onCurrencyChange: (projectId: string, currency: string) => void;
};

export function CreatorProjectsTab({
  projects,
  isLoading,
  savingCurrencyId,
  currencyError,
  onCurrencyChange,
}: ProjectsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Currency</CardTitle>
        <CardDescription>
          Choose the primary currency used to display project stats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currencyError ? (
          <p className="text-sm text-destructive">{currencyError}</p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create a project to set its reporting currency.
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-4 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.currency
                      ? `Current: ${project.currency}`
                      : "No currency set"}
                  </p>
                </div>
                <Select
                  value={(project.currency ?? "USD").toUpperCase()}
                  onValueChange={(value) =>
                    onCurrencyChange(project.id, value)
                  }
                  disabled={savingCurrencyId === project.id}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
