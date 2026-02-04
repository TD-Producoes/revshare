import { cn } from "@/lib/utils";

export function RevclawTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-white/10 bg-black/40">
      <table
        className={cn("w-full caption-bottom text-xs text-white/80", className)}
        {...props}
      />
    </div>
  );
}

export function RevclawThead({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "bg-white/[0.04] text-white/60 [&_tr]:border-b [&_tr]:border-white/10",
        className,
      )}
      {...props}
    />
  );
}

export function RevclawTbody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function RevclawTr({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-white/10 transition-colors hover:bg-white/[0.03]",
        className,
      )}
      {...props}
    />
  );
}

export function RevclawTh({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle text-xs font-semibold whitespace-nowrap text-white/70",
        className,
      )}
      {...props}
    />
  );
}

export function RevclawTd({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "px-4 py-2 align-middle text-xs whitespace-nowrap text-white/80",
        className,
      )}
      {...props}
    />
  );
}
