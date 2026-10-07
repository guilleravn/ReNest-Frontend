import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const countBadgeVariants = cva(
  "grid place-items-center rounded-full font-bold leading-none",
  {
    variants: {
      tone: {
        /** Default notification counter. */
        green: "bg-green-strong text-text-inverse",
        /** Attention counter on an unselected chip ("En proceso 1"). */
        amber: "bg-amber text-foreground",
        /** Counter inside a selected (solid green) chip. */
        inverse: "bg-text-inverse/25 text-text-inverse",
      },
      size: {
        md: "h-4 min-w-4 px-1 text-badge",
        sm: "size-4 text-count",
      },
    },
    defaultVariants: {
      tone: "green",
      size: "md",
    },
  }
)

type CountBadgeProps = VariantProps<typeof countBadgeVariants> & {
  children: ReactNode
  className?: string
}

/** Small round counter ("1") used on nav items, icons and chips. */
function CountBadge({ children, tone, size, className }: CountBadgeProps) {
  return (
    <span className={cn(countBadgeVariants({ tone, size }), className)}>
      {children}
    </span>
  )
}

export { CountBadge }
export type { CountBadgeProps }
