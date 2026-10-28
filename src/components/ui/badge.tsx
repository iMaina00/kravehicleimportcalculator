import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/70",
  {
    variants: {
      variant: {
        default: "glow-cobalt-sm border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "glass-chip border-border text-secondary-foreground hover:bg-white/10",
        destructive:
          "border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25",
        outline: "border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
