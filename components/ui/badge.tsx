import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "min-h-4 gap-1 rounded-full border border-transparent px-2 py-1 text-xs font-semibold transition-all has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/80 dark:border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80 dark:border-border/60",
        success:
          "bg-emerald-100 text-emerald-700 border-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40",
        destructive:
          "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20 dark:border-destructive/40",
        warning:
          "bg-yellow-100 text-yellow-800 border-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-300/40",
        info:
          "bg-blue-100 text-blue-800 border-blue-100 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-300/40",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground bg-input/20 dark:bg-input/30",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
