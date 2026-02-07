import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProjectTabEmptyState({
  title = "Nothing here yet",
  description,
  className,
}: {
  title?: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border/80 bg-background">
        <Inbox className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
