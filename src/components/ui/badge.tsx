import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-amber-500 text-neutral-900 shadow hover:bg-amber-500/80",
        secondary:
          "border-transparent bg-neutral-700 text-neutral-100 hover:bg-neutral-700/80",
        destructive:
          "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        outline: "text-neutral-300 border-neutral-600",
        success:
          "border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-500/80",
        warning:
          "border-transparent bg-amber-500 text-neutral-900 shadow hover:bg-amber-500/80",
        info:
          "border-transparent bg-cyan-500 text-white shadow hover:bg-cyan-500/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
